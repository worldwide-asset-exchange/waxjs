import { WaxEventSource } from "./WaxEventSource";

export class WaxJS {
  private waxEventSource: WaxEventSource;

  constructor(private waxSigningURL: string = "http://localhost:3000") {
    this.waxEventSource = new WaxEventSource(waxSigningURL);
  }

  public async login() {
    let confirmationWindow = await this.waxEventSource.openEventSource(
      this.waxSigningURL + "/login/"
    );

    const receiveMessage = async (event: any) => {
      let { verified, userAccount } = event.data;
      if (!verified || userAccount == null) {
        throw new Error("User denied to share userAccount");
      }

      return userAccount;
    };

    return this.waxEventSource.onceEvent(
      confirmationWindow,
      this.waxSigningURL,
      receiveMessage
    );
  }

  public async signing(transaction: any) {
    let confirmationWindow: Window = await this.waxEventSource.openEventSource(
      this.waxSigningURL + "/signing/",
      { type: "TRANSACTION", transaction }
    );

    const signTransaction = async (event: any) => {
      if (event.data.type === "TX_SIGNED") {
        const { verified, signature } = event.data;
        if (!verified || signature == null) {
          throw new Error("User denied to sign transaction");
        }

        return signature;
      }
    };

    return this.waxEventSource.onceEvent(
      confirmationWindow,
      this.waxSigningURL,
      signTransaction
    );
  }
}
