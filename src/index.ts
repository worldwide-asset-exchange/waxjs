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
      return this.loginViaEndpoint();
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
    const json = await response.json();
    if (json.processed && json.processed.except) {
      throw new Error(json);
    }
    return this.receiveLogin({
      data: {
        verified: json.verified,
        userAccount: json.account_name,
        pubKeys: json.public_keys,
        whitelistedContracts: this.getWhitelistedContracts(),
        autoLogin: true
      }
    });
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
    this.setWhitelistedContracts(whitelistedContracts);
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
        this.signingWindow = await window.open(url, "_blank");
      }
      return await transact(transaction, namedParams);
    };

    return this.userAccount;
  }

  private getWhitelistedContracts() {
    return JSON.parse(localStorage.getItem("whitelistedContracts") || "[]");
  }

  private setWhitelistedContracts(whitelistedContracts: any = []) {
    localStorage.setItem(
      "whitelistedContracts",
      JSON.stringify(whitelistedContracts)
    );
  }

  private async canAutoSign(transaction: any) {
    const deserializedTransaction = transaction.actions
      ? transaction
      : await this.api.deserializeTransactionWithActions(transaction);
    const whitelistedContracts = this.getWhitelistedContracts();
    return !deserializedTransaction.actions.find((action: any) => {
      return !this.isWhitelisted(whitelistedContracts, action);
    });
  }

  private isWhitelisted(whitelistedContracts: any, action: any) {
    return !!whitelistedContracts.find((w: any) => {
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
      return this.signViaEndpoint(transaction);
    }

    return this.signViaWindow(this.signingWindow, transaction);
  }

  private async signViaEndpoint(transaction: any) {
    try {
      let json;
      let response;
      response = await fetch(this.waxAutoSigningURL + "signing", {
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
      json = await response.json();
      if (json.processed && json.processed.except) {
        throw new Error(json);
      }
      const { signatures } = json;
      if (signatures == null) {
        throw new Error("Endpoint failed to sign the transaction");
      }
      return signatures;
    } catch (e) {
      // clear the whitelist to make sure we don't repeatedly attempt blocked actions
      this.setWhitelistedContracts();
      throw e;
    }
  }

  private async signViaWindow(window: Window, transaction: any) {
    const confirmationWindow: Window = await this.waxEventSource.openEventSource(
      this.waxSigningURL + "/cloud-wallet/signing/",
      { type: "TRANSACTION", transaction },
      window
    );

    const signTransaction = async (event: any) => {
      if (event.data.type === "TX_SIGNED") {
        const { verified, signatures, whitelistedContracts } = event.data;
        this.setWhitelistedContracts(whitelistedContracts);
        if (!verified || signatures == null) {
          throw new Error("User declined to sign the transaction");
        }

        return signatures;
      }
    };

    return this.waxEventSource.onceEvent(
      confirmationWindow,
      this.waxSigningURL,
      signTransaction
    );
  }
}
