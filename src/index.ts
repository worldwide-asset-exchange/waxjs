export class WaxJS {
  constructor(private waxSigningURL: string = "http://localhost:3000") {}

  public async login() {
    let confirmationWindow = await this.openTab(this.waxSigningURL + "/login/");

    return new Promise((resolve, reject) => {
      const receiveMessage = async (event: any) => {
        // validate origin with the ui uri
        if (event.origin !== this.waxSigningURL) {
          reject(new Error("Invalid origin"));
        }

        let { verified, userAccount } = event.data;
        if (verified && userAccount !== null) {
          resolve(userAccount);
        } else {
          reject(new Error("User denied to share userAccount"));
        }
      };

      (window as Window).addEventListener("message", receiveMessage, false);
    });
  }

  public async signing(transaction: any) {
    let confirmationWindow = await this.openTab(
      this.waxSigningURL + "/signing/"
    );

    return new Promise((resolve, reject) => {
      const receiveMessage = async (event: any) => {
        // validate origin with the ui uri
        if (event.origin !== this.waxSigningURL) {
          reject(new Error("Invalid origin"));
        }

        switch (event.data.type) {
          case "READY":
            confirmationWindow.postMessage(
              { type: "TRANSACTION", transaction },
              this.waxSigningURL
            );
            break;
          case "TX_SIGNED":
            let { verified, signature } = event.data;
            if (verified && signature !== null) {
              resolve(signature);
            } else {
              reject(new Error("User denied to sign transaction"));
            }
            break;
          default:
            reject(new Error("Invalid data"));
        }
      };

      (window as Window).addEventListener("message", receiveMessage, false);
    });
  }

  private async openTab(url: string): Promise<any> {
    return window.open(url, "_blank");
  }
}
