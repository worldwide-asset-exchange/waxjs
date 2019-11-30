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
    private waxAutoSigningURL: string = "https://api-idm.wax.io/v1/accounts/auto-accept/signing"
  ) {
    this.waxEventSource = new WaxEventSource(waxSigningURL);
    this.rpc = new JsonRpc(rcpEndpoint);
  }

  public async login() {
    const confirmationWindow = await this.waxEventSource.openEventSource(
      this.waxSigningURL + "/cloud-wallet/login/"
    );

    const receiveMessage = async (event: any) => {
      const {
        verified,
        userAccount,
        pubKeys,
        whitelistedContracts
      } = event.data;
      if (!verified) {
        throw new Error("User declined to share their user account");
      }

      if (userAccount == null || pubKeys == null) {
        throw new Error("User does not have a blockchain account");
      }

      this.userAccount = userAccount;
      this.pubKeys = pubKeys;
      this.whitelistedContracts = whitelistedContracts;

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
        if (!this.autoAccept(transaction)) {
          this.signingWindow = await window.open(url, "_blank");
        }
        return await transact(transaction, namedParams);
      };

      return this.userAccount;
    };

    return this.waxEventSource.onceEvent(
      confirmationWindow,
      this.waxSigningURL,
      receiveMessage
    );
  }

  private autoAccept(transaction: any) {
    const deserializedTransaction = transaction.actions
      ? transaction
      : this.api.deserializeTransaction(transaction);
    return (
      undefined !==
      deserializedTransaction.actions.find((a: any) => {
        return this.whitelistedContracts.find(w => w.contract === a.account);
      })
    );
  }

  private async signing(transaction: any) {
    if (this.autoAccept(transaction)) {
      return this.signViaEndpoint(transaction);
    }

    return this.signViaWindow(this.signingWindow, transaction);
  }

  private async signViaEndpoint(transaction: any) {
    try {
      let json;
      let response;
      try {
        const f = (global as any).fetch;
        response = await f(this.waxAutoSigningURL, {
          body: JSON.stringify({
            serializedTransaction: Object.values(transaction)
          }),
          method: "POST"
        });
        json = await response.json();
        if (json.processed && json.processed.except) {
          throw new Error(json);
        }
      } catch (e) {
        e.isFetchError = true;
        throw e;
      }
      if (!response.ok) {
        throw new Error(json);
      }
      const { verified, signatures } = json;
      if (!verified || signatures == null) {
        throw new Error("Endpoint failed to sign the transaction");
      }
      return signatures;
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

    const signTransaction = async (event: any) => {
      if (event.data.type === "TX_SIGNED") {
        const { verified, signatures, whitelistedContracts } = event.data;
        this.whitelistedContracts = whitelistedContracts;
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
