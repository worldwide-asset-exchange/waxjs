import { Api, JsonRpc, RpcError } from "eosjs";
import { WaxEventSource } from "./WaxEventSource";
import { WhitelistedContract } from "./WhitelistedContract";

export class WaxJS {
  private waxEventSource: WaxEventSource;
  private readonly rpc: JsonRpc;
  private api: Api;
  private userAccount: string;
  private pubKeys: string[];
  private signingWindow: Window;
  private whitelistedContracts: WhitelistedContract[];

  constructor(
    rcpEndpoint: string,
    private waxSigningURL: string = "https://all-access.wax.io",
    private waxAutoSigningURL: string = "https://api-idm.wax.io/v1/accounts/auto-accept/"
  ) {
    this.waxEventSource = new WaxEventSource(waxSigningURL);
    this.rpc = new JsonRpc(rcpEndpoint);
  }

  public async login() {
    if (this.canAutoLogin()) {
      return this.loginViaEndpoint().catch(() =>
        // Attempt to recover by logging in via the window method
        this.loginViaWindow()
      );
    }

    return this.loginViaWindow();
  }

  private async loginViaWindow() {
    const confirmationWindow = await this.waxEventSource.openEventSource(
      this.waxSigningURL + "/cloud-wallet/login/"
    );

    return this.waxEventSource.onceEvent(
      confirmationWindow,
      this.waxSigningURL,
      this.receiveLogin.bind(this)
    );
  }

  private async loginViaEndpoint() {
    const response = await fetch(this.waxAutoSigningURL + "login", {
      method: "get",
      credentials: "include"
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

  private canAutoLogin() {
    return localStorage.getItem("autoLogin") === "true";
  }

  private async receiveLogin(event: any) {
    const {
      verified,
      userAccount,
      pubKeys,
      whitelistedContracts,
      autoLogin
    } = event.data;
    if (!verified) {
      throw new Error("User declined to share their user account");
    }

    if (userAccount == null || pubKeys == null) {
      throw new Error("User does not have a blockchain account");
    }

    localStorage.setItem("autoLogin", autoLogin);
    this.whitelistedContracts = whitelistedContracts || [];
    this.userAccount = userAccount;
    this.pubKeys = pubKeys;

    const signer = {
      getAvailableKeys: () => {
        return this.pubKeys;
      },
      sign: async (data: any) => {
        return {
          serializedTransaction: data.serializedTransaction,
          signatures: await this.signing(data.serializedTransaction)
        };
      }
    };
    // @ts-ignore
    this.api = new Api({ rpc: this.rpc, signatureProvider: signer });
    const transact = this.api.transact.bind(this.api);
    const url = this.waxSigningURL + "/cloud-wallet/signing/";
    // We monkeypatch the transact method to overcome timeouts
    // firing the pop-up which some browsers enforce, such as Safari.
    // By pre-creating the pop-up window we will interact with,
    // we ensure that it is not going to be rejected due to a delayed
    // pop up that would otherwise occur post transaction creation
    this.api.transact = async (transaction, namedParams) => {
      if (!(await this.canAutoSign(transaction))) {
        this.signingWindow = await window.open(
          url,
          "WaxPopup",
          "height=800,width=600"
        );
      }
      return await transact(transaction, namedParams);
    };

    return this.userAccount;
  }

  private async canAutoSign(transaction: any) {
    const deserializedTransaction = transaction.actions
      ? transaction
      : await this.api.deserializeTransactionWithActions(transaction);
    return !deserializedTransaction.actions.find((action: any) => {
      return !this.isWhitelisted(action);
    });
  }

  private isWhitelisted(action: any) {
    return !!this.whitelistedContracts.find((w: any) => {
      if (w.contract === action.account) {
        if (action.account === "eosio.token" && action.name === "transfer") {
          return w.recipients.includes(action.data.to);
        }
        return true;
      }
      return false;
    });
  }

  private async signing(transaction: any) {
    if (await this.canAutoSign(transaction)) {
      return this.signViaEndpoint(transaction).catch(() =>
        // Attempt to recover by signing via the window method
        this.signViaWindow(undefined, transaction)
      );
    }

    return this.signViaWindow(this.signingWindow, transaction);
  }

  private async signViaEndpoint(transaction: any) {
    try {
      const response: any = await fetch(this.waxAutoSigningURL + "signing", {
        body: JSON.stringify({
          transaction: Object.values(transaction)
        }),
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        method: "POST"
      });
      if (!response.ok) {
        throw new Error(
          `Signing Endpoint Error ${response.status} ${response.statusText}`
        );
      }
      const data: any = await response.json();
      if (data.processed && data.processed.except) {
        throw new Error(data);
      }
      return this.receiveSignatures({ data });
    } catch (e) {
      // clear the whitelist to make sure we don't repeatedly attempt blocked actions
      this.whitelistedContracts = [];
      throw e;
    }
  }

  private async signViaWindow(window: Window, transaction: any) {
    const confirmationWindow: Window = await this.waxEventSource.openEventSource(
      this.waxSigningURL + "/cloud-wallet/signing/",
      { type: "TRANSACTION", transaction },
      window
    );

    return this.waxEventSource.onceEvent(
      confirmationWindow,
      this.waxSigningURL,
      this.receiveSignatures.bind(this)
    );
  }

  private async receiveSignatures(event: any) {
    if (event.data.type === "TX_SIGNED") {
      const { verified, signatures, whitelistedContracts } = event.data;
      if (!verified || signatures == null) {
        throw new Error("User declined to sign the transaction");
      }
      this.whitelistedContracts = whitelistedContracts || [];

      return signatures;
    }
  }
}
