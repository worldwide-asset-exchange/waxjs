import { Transaction } from "eosjs/dist/eosjs-api-interfaces";
import { Action } from "eosjs/dist/eosjs-serialize";
import {
  ILoginResponse,
  ISigningResponse,
  IWhitelistedContract
} from "./interfaces";
import { WaxEventSource } from "./WaxEventSource";

export class WaxSigningApi {
  private waxEventSource: WaxEventSource;

  private user?: ILoginResponse;

  private signingWindow?: Window;

  private whitelistedContracts?: IWhitelistedContract[];

  constructor(
    readonly waxSigningURL: string,
    readonly waxAutoSigningURL: string
  ) {
    this.waxEventSource = new WaxEventSource(waxSigningURL);
  }

  public async login(): Promise<ILoginResponse> {
    if (!this.user) {
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

  public async signing(
    transaction: Transaction,
    serializedTransaction: Uint8Array,
    noModify = false,
    feeFallback = true
  ): Promise<ISigningResponse> {
    if (this.canAutoSign(transaction)) {
      try {
        return await this.signViaEndpoint(
          serializedTransaction,
          noModify,
          feeFallback
        );
      } catch {
        // handle by continuing
      }
    }

    return await this.signViaWindow(
      serializedTransaction,
      this.signingWindow,
      noModify
    );
  }

  private async loginViaWindow(): Promise<boolean> {
    const confirmationWindow = await this.waxEventSource.openEventSource(
      `${this.waxSigningURL}/cloud-wallet/login/`
    );

    return this.waxEventSource.onceEvent(
      confirmationWindow,
      this.waxSigningURL,
      this.receiveLogin.bind(this),
      undefined
    );
  }

  private async loginViaEndpoint(): Promise<boolean> {
    const response = await fetch(`${this.waxAutoSigningURL}login`, {
      credentials: "include",
      method: "get"
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
    feeFallback = true
  ): Promise<ISigningResponse> {
    const controller = new AbortController();

    setTimeout(() => controller.abort(), 5000);

    const response: any = await fetch(`${this.waxAutoSigningURL}signing`, {
      body: JSON.stringify({
        freeBandwidth: !noModify,
        feeFallback,
        transaction: Object.values(serializedTransaction)
      }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
      signal: controller.signal
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

  private async signViaWindow(
    serializedTransaction: Uint8Array,
    window?: Window,
    noModify = false,
    feeFallback = true
  ): Promise<ISigningResponse> {
    const confirmationWindow: Window = await this.waxEventSource.openEventSource(
      `${this.waxSigningURL}/cloud-wallet/signing/`,
      {
        feeFallback,
        freeBandwidth: !noModify,
        transaction: serializedTransaction,
        type: "TRANSACTION"
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
    const { verified, userAccount, pubKeys, whitelistedContracts } = event.data;

    if (!verified) {
      throw new Error("User declined to share their user account");
    }

    if (!userAccount || !pubKeys) {
      throw new Error("User does not have a blockchain account");
    }

    this.whitelistedContracts = whitelistedContracts || [];
    this.user = { account: userAccount, keys: pubKeys };

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
        serializedTransaction
      } = event.data;

      if (!verified || !signatures) {
        throw new Error("User declined to sign the transaction");
      }

      this.whitelistedContracts = whitelistedContracts || [];

      return { serializedTransaction, signatures };
    }

    throw new Error(
      `Unexpected response received when attempting signing: ${JSON.stringify(
        event.data
      )}`
    );
  }

  private canAutoSign(transaction: Transaction): boolean {
    const ua = navigator.userAgent.toLowerCase();

    if (ua.search("chrome") === -1 && ua.search("safari") >= 0) {
      return false;
    }

    return !transaction.actions.find(action => !this.isWhitelisted(action));
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
