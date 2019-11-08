import { WaxEventSource } from "./WaxEventSource";
import { Api, JsonRpc, RpcError } from "eosjs";

export class WaxJS {
  private waxEventSource: WaxEventSource;
  private readonly rpc: JsonRpc;
  private api: Api;
  private userAccount: string;
  private pubKeys: string[];

  constructor(
    rcpEndpoint: string,
    private waxSigningURL: string = "https://all-access.wax.io"
  ) {
    this.waxEventSource = new WaxEventSource(waxSigningURL);
    this.rpc = new JsonRpc(rcpEndpoint);
  }

  public async login() {
    let confirmationWindow = await this.waxEventSource.openEventSource(
      this.waxSigningURL + "/cloud-wallet/login/"
    );

    const receiveMessage = async (event: any) => {
      let { verified, userAccount, pubKeys } = event.data;
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
            signatures: await this.signing(data.serializedTransaction)
          };
        }
      };
      // @ts-ignore
      this.api = new Api({ rpc: this.rpc, signatureProvider: signer });
      return this.userAccount;
    };

    return this.waxEventSource.onceEvent(
      confirmationWindow,
      this.waxSigningURL,
      receiveMessage
    );
  }

  private async signing(transaction: any) {
    let confirmationWindow: Window = await this.waxEventSource.openEventSource(
      this.waxSigningURL + "/cloud-wallet/signing/",
      { type: "TRANSACTION", transaction }
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
