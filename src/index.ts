import { WaxEventSource } from "./WaxEventSource";
import { Api, JsonRpc, RpcError } from "eosjs";

export class WaxJS {
  private waxEventSource: WaxEventSource;
  private readonly rpc: JsonRpc;
  private readonly api: Api;
  private pubKeys: string[];

  constructor(
    private waxSigningURL: string = "http://localhost:3000",
    rcpEndpoint: string
  ) {
    this.waxEventSource = new WaxEventSource(waxSigningURL);
    this.rpc = new JsonRpc(rcpEndpoint);

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
  }

  public async login() {
    let confirmationWindow = await this.waxEventSource.openEventSource(
      this.waxSigningURL + "/login/"
    );

    const receiveMessage = async (event: any) => {
      let { verified, userAccount, pubKeys } = event.data;
      if (!verified) {
        throw new Error("User denied to share userAccount");
      }

      if (userAccount == null || pubKeys == null) {
        throw new Error("User don't have a blockchain account");
      }

      this.pubKeys = pubKeys;
      return { userAccount, rpc: this.rpc, api: this.api };
    };

    return this.waxEventSource.onceEvent(
      confirmationWindow,
      this.waxSigningURL,
      receiveMessage
    );
  }

  private async signing(transaction: any) {
    let confirmationWindow: Window = await this.waxEventSource.openEventSource(
      this.waxSigningURL + "/signing/",
      { type: "TRANSACTION", transaction }
    );

    const signTransaction = async (event: any) => {
      if (event.data.type === "TX_SIGNED") {
        const { verified, signatures } = event.data;
        if (!verified || signatures == null) {
          throw new Error("User denied to sign transaction");
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
