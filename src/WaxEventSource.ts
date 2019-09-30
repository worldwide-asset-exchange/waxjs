export class WaxEventSource {
  constructor(private waxSigningURL: string = "http://localhost:3000") {
    this.openEventSource = this.openEventSource.bind(this);
    this.onceEvent = this.onceEvent.bind(this);
  }

  public async openEventSource(url: string, message?: any): Promise<any> {
    let openedWindow = await window.open(url, "_blank");

    if (typeof message === "undefined") {
      return openedWindow;
    }

    const postTransaction = async (event: any) => {
      if (event.data.type === "READY") {
        // @ts-ignore
        openedWindow.postMessage(message, this.waxSigningURL);
      }
    };

    await this.onceEvent(
      // @ts-ignore
      openedWindow,
      this.waxSigningURL,
      postTransaction
    );

    return openedWindow;
  }

  public async onceEvent(
    source: Window,
    origin: string,
    action: (e: any) => void
  ) {
    return new Promise((resolve, reject) => {
      (window as Window).addEventListener(
        "message",
        async function onEvent(event) {
          // Validate expected origin for event
          if (event.origin !== origin) {
            reject(new Error("Invalid origin"));
          }

          // Validate expected source for event
          if (event.source !== source) {
            return;
          }

          try {
            const result: any = await action(event);
            resolve(result);
          } catch (e) {
            reject(e);
          }

          (window as Window).removeEventListener("message", onEvent, false);
        },
        false
      );
    });
  }
}
