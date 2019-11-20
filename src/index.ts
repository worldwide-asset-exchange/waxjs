import { Api, JsonRpc, RpcError } from "eosjs";
import { WaxEventSource } from "./WaxEventSource";

export class WaxJS {
  private waxEventSource: WaxEventSource;
  private readonly rpc: JsonRpc;
  private api: Api;
  private userAccount: string;
  private pubKeys: string[];
  private signingWindow: Window;

  constructor(
    rcpEndpoint: string,
    private waxSigningURL: string = "https://all-access.wax.io"
  ) {
    this.waxEventSource = new WaxEventSource(waxSigningURL);
    this.rpc = new JsonRpc(rcpEndpoint);
  }

  public async login() {
    const confirmationWindow = await this.waxEventSource.openEventSource(
      this.waxSigningURL + "/cloud-wallet/login/"
    );

    const receiveMessage = async (event: any) => {
      const { verified, userAccount, pubKeys } = event.data;
      if (!verified) {
        throw new Error("User declined to share their user account");
      }

      if (userAccount == null || pubKeys == null) {
        throw new Error("User does not have a blockchain account");
      }

      this.userAccount = userAccount;
      this.pubKeys = pubKeys;

      const signer = {
        getAvailableKeys: () => {
          return this.pubKeys;
        },
        sign: async (data: any) => {
          return {
            serializedTransaction: data.serializedTransaction,
            signatures: await this.signing(
              this.signingWindow,
              data.serializedTransaction
            )
          };
        }
      };
      // @ts-ignore
      this.api = new Api({ rpc: this.rpc, signatureProvider: signer });
      const transact = this.api.transact.bind(this.api);
      const url = this.waxSigningURL + "/cloud-wallet/signing/";
      this.api.transact = async (...args) => {
        this.signingWindow = await window.open(url, "_blank");
        return await transact(...args);
      };

      return this.userAccount;
    };

    return this.waxEventSource.onceEvent(
      confirmationWindow,
      this.waxSigningURL,
      receiveMessage
    );
  }

  private async signing(window: Window, transaction: any) {
    const confirmationWindow: Window = await this.waxEventSource.openEventSource(
      this.waxSigningURL + "/cloud-wallet/signing/",
      { type: "TRANSACTION", transaction },
      window
    );

    const signTransaction = async (event: any) => {
      if (event.data.type === "TX_SIGNED") {
        const { verified, signatures } = event.data;
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
