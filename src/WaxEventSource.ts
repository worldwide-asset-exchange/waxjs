export class WaxEventSource {
  constructor(private waxSigningURL: string = "http://localhost:3000") {
    this.openEventSource = this.openEventSource.bind(this);
    this.onceEvent = this.onceEvent.bind(this);
  }

  public async openEventSource(
    url: string,
    message?: any,
    win?: Window
  ): Promise<any> {
    const openedWindow = win
      ? win
      : await window.open(url, "WaxPopup", "height=800,width=600");

    if (!openedWindow) {
      throw new Error("Unable to open a popup window");
    }

    if (typeof message === "undefined") {
      return openedWindow;
    }

    const postTransaction = async (event: any) => {
      if (event.data.type === "READY") {
        // @ts-ignore
        openedWindow.postMessage(message, this.waxSigningURL);
      }
    };

    const eventPromise = this.onceEvent(
      // @ts-ignore
      openedWindow,
      this.waxSigningURL,
      postTransaction
    );

    await Promise.race([eventPromise, this.timeout()]).catch(err => {
      if (err.message !== "Timeout") {
        throw err;
      }

      openedWindow.postMessage(message, this.waxSigningURL);
    });

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
            return;
          }

          // Validate expected source for event
          if (event.source !== source) {
            return;
          }

          if (typeof event.data !== "object") {
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

  private timeout = () => {
    return new Promise((resolve, reject) => {
      const wait = setTimeout(() => {
        clearTimeout(wait);
        reject(new Error("Timeout"));
      }, 2000);
    });
  };
}
