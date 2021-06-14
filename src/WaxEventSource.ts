export class WaxEventSource {
  private iframeContainer;
  private iframe;
  constructor(private waxSigningURL: string = "http://localhost:3000") {
    this.openEventSource = this.openEventSource.bind(this);
    this.onceEvent = this.onceEvent.bind(this);
    this.iframeContainer = null;
    this.iframe = null;
  }
  public setupIframe() {
    if (!this.iframeContainer) {
      this.iframeContainer = document.createElement("div");
    }
    this.iframeContainer.style.zIndex = 5000;
    this.iframeContainer.style.position = "fixed";
    this.iframeContainer.style.alignSelf = "center";
    this.iframeContainer.style.top = "10px";
    this.iframeContainer.style.width = "100%";
    this.iframeContainer.style.maxWidth = "800px";
    this.iframeContainer.style.height = "100%";
    this.iframeContainer.style.overflowY = "scroll";
    this.iframeContainer.innerHTML =
      "<div style='position:absolute;cursor: pointer; width:50px;z-index: 10; font-size:36px; font-weight: 800; border: solid 4px #000000; height:50px; color:black; right:1px; top:10px; background: #fff; border-radius: 50%; text-align: center; vertical-align: center' onclick='globalThis.waxjs.closeIframe()'>X</div> ";

    /*
    this.closeButton = document.createElement("div");
    this.closeButton.style.position = "fixed";
    this.closeButton.style.width = "50px";
    this.closeButton.style.height = "50px";
    this.closeButton.style.zIndex = 100001;
    this.closeButton.style.cursor = "pointer";

    this.closeButton.innerHTML = "X";
    this.closeButton.style.textAlign = "center";
    */
    if (!this.iframe) {
      this.iframe = document.createElement("iframe");
    }
    this.iframe.src = this.waxSigningURL + "/cloud-wallet/signing/";
    this.iframe.style.position = "absolute";
    this.iframe.style.width = "100%";
    this.iframe.style.height = "800px";
    this.iframe.style.left = "0%";
    this.iframe.style.top = "0px";
    globalThis.waxjs = { closeIframe: this.closeIframe.bind(this) };
  }
  public showIframe() {
    this.setupIframe();
    document.body.append(this.iframeContainer);
    this.iframeContainer.append(this.iframe);
    return this.iframe.contentWindow;
  }
  public closeIframe() {
    if (this.iframeContainer) {
      this.iframeContainer.remove();
    }
  }
  public async openEventSource(
    url: string,
    message?: any,
    win?: Window
  ): Promise<any> {
    let openedWindow = win
      ? win
      : await window.open(url, "WaxPopup", "height=800,width=600");

    if (!openedWindow) {
      openedWindow = this.showIframe();
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
            if (globalThis.waxjs.closeIframe()) {
              globalThis.waxjs.closeIframe();
            }
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
