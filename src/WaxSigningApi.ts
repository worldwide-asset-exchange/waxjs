import { JsonRpc } from "eosjs";
import { Transaction } from "eosjs/dist/eosjs-api-interfaces";
import { ecc } from "eosjs/dist/eosjs-ecc-migration";
import { Action } from "eosjs/dist/eosjs-serialize";

import { Protocol } from "puppeteer";

import { getProofWaxRequiredKeys } from "./helpers";
import {
  ILoginResponse,
  ISigningResponse,
  IWhitelistedContract,
} from "./interfaces";
import { version } from "./version";
import { WaxEventSource } from "./WaxEventSource";
import integer = Protocol.integer;

function getCurrentTime() {
  return Math.floor(new Date().getTime());
}
export class WaxSigningApi {
  private waxEventSource: WaxEventSource;

  private user?: ILoginResponse;

  private signingWindow?: Window;

  private whitelistedContracts?: IWhitelistedContract[];

  private nonce: string = "";

  constructor(
    readonly waxSigningURL: string,
    readonly waxAutoSigningURL: string,
    readonly rpc: JsonRpc,
    readonly metricURL?: string,
    readonly returnTempAccount?: boolean
  ) {
    this.waxEventSource = new WaxEventSource(waxSigningURL);
    this.metricURL = metricURL;
    this.returnTempAccount = returnTempAccount;
    this.rpc = rpc;
  }
  public logout(): void {
    this.user = null;
  }
  public async login(nonce?: string): Promise<ILoginResponse> {
    if (!this.user) {
      this.nonce = nonce;
      await this.loginViaWindow();
    }

    if (this.user) {
      return this.user;
    }

    throw new Error("Login failed");
  }

  public async tryAutologin(): Promise<boolean> {
    if (this.user) {
      return true;
    }
    try {
      await this.loginViaEndpoint();

      return true;
    } catch (e) {
      return false;
    }
  }

  public async prepareTransaction(transaction: Transaction): Promise<void> {
    if (!this.canAutoSign(transaction)) {
      this.signingWindow = await this.waxEventSource.openPopup(
        `${this.waxSigningURL}/cloud-wallet/signing/`
      );
    }
  }
  public async metricLog(
    name: string,
    value: number = 0,
    tags: any[] = []
  ): Promise<void> {
    try {
      if (this.metricURL !== "") {
        await fetch(this.metricURL, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, value, tags }),
        });
      }
    } catch (e) {
      console.debug(e);
      // do nothing
    }
  }
  public async signing(
    transaction: Transaction,
    serializedTransaction: Uint8Array,
    noModify = false,
    feeFallback = true,
    chainId = null,
  ): Promise<ISigningResponse> {
    if (this.canAutoSign(transaction)) {
      try {
        const startTime = getCurrentTime();
        const res = await this.signViaEndpoint(
          serializedTransaction,
          noModify,
          feeFallback,
          chainId
        );
        await this.metricLog(
          "waxjs.metric.auto_signing",
          getCurrentTime() - startTime,
          []
        );
        return res;
      } catch {
        // handle by continuing
      }
    }

    return await this.signViaWindow(
      serializedTransaction,
      this.signingWindow,
      noModify,
      feeFallback,
      chainId
    );
  }
  public async proofWindow(
    nonce: string,
    type: integer,
    description: string | null
  ): Promise<any> {
    const verifyUrl = `${this.waxSigningURL}/cloud-wallet/verify`;
    const referWindow: Window = await this.waxEventSource.openEventSource(
      verifyUrl,
      {
        type: "VERIFY",
        nonce,
        proof_type: type,
        description,
      }
    );
    return this.waxEventSource.onceEvent(
      referWindow,
      this.waxSigningURL,
      this.receiveVerfication.bind(this),
      undefined
    );
  }
  private async loginViaWindow(): Promise<boolean> {
    const url = new URL(`${this.waxSigningURL}/cloud-wallet/login`);
    if (this.returnTempAccount) {
      url.searchParams.append("returnTemp", "true");
    }
    if (version) {
      url.searchParams.append("v", Buffer.from(version).toString("base64"));
    }
    if (this.nonce) {
      url.searchParams.append("n", Buffer.from(this.nonce).toString("base64"));
    }
    const confirmationWindow = await this.waxEventSource.openEventSource(
      url.toString()
    );

    return this.waxEventSource.onceEvent(
      confirmationWindow,
      this.waxSigningURL,
      this.receiveLogin.bind(this),
      undefined
    );
  }

  private async loginViaEndpoint(): Promise<boolean> {
    const url = new URL(`${this.waxAutoSigningURL}login`);
    if (this.returnTempAccount) {
      url.search = "returnTemp=true";
    } else {
      url.search = "";
    }
    const response = await fetch(url.toString(), {
      credentials: "include",
      method: "get",
    });

    if (!response.ok) {
      throw new Error(
        `Login Endpoint Error ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (data.processed && data.processed.except) {
      throw new Error(data);
    }

    return this.receiveLogin({ data });
  }

  private async signViaEndpoint(
    serializedTransaction: Uint8Array,
    noModify = false,
    feeFallback = true,
    chainId = null,
  ): Promise<ISigningResponse> {
    const controller = new AbortController();

    setTimeout(() => controller.abort(), 5000);
    const response: any = await fetch(`${this.waxAutoSigningURL}signing`, {
      body: JSON.stringify({
        freeBandwidth: !noModify,
        feeFallback,
        chainId,
        transaction: Object.values(serializedTransaction),
        waxjsVersion: version
      }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
      signal: controller.signal,
    });

    if (!response.ok) {
      this.whitelistedContracts = [];

      throw new Error(
        `Signing Endpoint Error ${response.status} ${response.statusText}`
      );
    }

    const data: any = await response.json();

    if (data.processed && data.processed.except) {
      this.whitelistedContracts = [];

      throw new Error(
        `Error returned from signing endpoint: ${JSON.stringify(data)}`
      );
    }

    return this.receiveSignatures({ data });
  }

  private receiveVerfication(event: { data: any }): Promise<any> {
    if (event.data.type === "DENY") {
      throw new Error("User Denied Verification");
    }
    return { ...event.data };
  }

  private async signViaWindow(
    serializedTransaction: Uint8Array,
    window?: Window,
    noModify = false,
    feeFallback = true,
    chainId = null,
  ): Promise<ISigningResponse> {
    const startTime = getCurrentTime();
    const confirmationWindow: Window =
      await this.waxEventSource.openEventSource(
        `${this.waxSigningURL}/cloud-wallet/signing/`,
        {
          startTime,
          feeFallback,
          chainId,
          freeBandwidth: !noModify,
          transaction: serializedTransaction,
          type: "TRANSACTION",
          waxjsVersion: version
        },
        window
      );

    return this.waxEventSource.onceEvent(
      confirmationWindow,
      this.waxSigningURL,
      this.receiveSignatures.bind(this),
      "TX_SIGNED"
    );
  }

  private async receiveLogin(event: { data: any }): Promise<boolean> {
    const {
      verified,
      userAccount,
      pubKeys,
      whitelistedContracts,
      isTemp,
      createData,
      avatar_url: avatarUrl,
      trustScore,
      proof,
    } = event.data;
    let isProofVerified = false;
    if (!verified) {
      throw new Error("User declined to share their user account");
    }

    if (!userAccount || !pubKeys) {
      throw new Error("User does not have a blockchain account");
    }
    if (proof?.verified && this.nonce) {
      // handle proof logic
      const message = `cloudwallet-verification-${proof.data.referer}-${this.nonce}-${userAccount}`;
      isProofVerified = ecc.verify(
        proof.data.signature,
        message,
        await getProofWaxRequiredKeys(this.rpc.endpoint)
      );
    }

    this.whitelistedContracts = whitelistedContracts || [];
    this.user = {
      account: userAccount,
      keys: pubKeys,
      isTemp,
      createData,
      avatarUrl,
      trustScore,
      isProofVerified,
    };
    return true;
  }

  private async receiveSignatures(event: {
    data: any;
  }): Promise<ISigningResponse> {
    if (event.data.type === "TX_SIGNED") {
      const {
        verified,
        signatures,
        whitelistedContracts,
        serializedTransaction,
        startTime,
      } = event.data;

      if (!verified || !signatures) {
        throw new Error("User declined to sign the transaction");
      }

      this.whitelistedContracts = whitelistedContracts || [];
      if (startTime && startTime > 0) {
        this.metricLog(
          "waxjs.metric.manual_sign_transaction_time",
          getCurrentTime() - startTime,
          []
        );
      }
      return { serializedTransaction, signatures };
    }

    throw new Error(
      `Unexpected response received when attempting signing: ${JSON.stringify(
        event.data
      )}`
    );
  }

  private canAutoSign(transaction: Transaction): boolean {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();

      if (ua.search("chrome") === -1 && ua.search("safari") >= 0) {
        return false;
      }
    }

    return !transaction.actions.find((action) => !this.isWhitelisted(action));
  }

  private isWhitelisted(action: Action): boolean {
    return !!(
      this.whitelistedContracts &&
      !!this.whitelistedContracts.find((w: any) => {
        if (w.contract === action.account) {
          if (action.account === "eosio.token" && action.name === "transfer") {
            return w.recipients.includes(action.data.to);
          }

          return true;
        }

        return false;
      })
    );
  }
}
