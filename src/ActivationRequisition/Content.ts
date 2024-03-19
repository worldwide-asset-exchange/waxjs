import * as QRCode from "qrcode-svg";
import { RequisitionInfo } from "./index";
import {
  createScanIcon,
  createFlexDiv,
  createLogoImage,
  createMobileIcon,
  createTextWithIcon,
  createDesktopIcon,
  createLogoIcon,
  createCloseIcon,
  createInfoIcon,
  createCopyIcon,
  createButton,
  createExpiredIcon,
  createLoadingSection,
  copyToClipboard,
} from "../helpers";
import { WaxJS } from "..";

export class Content {
  public static async createContent(
    requisitionInfo: RequisitionInfo,
    waxObj: WaxJS
  ): Promise<HTMLDivElement> {
    console.log("requisitionInfo", requisitionInfo);
    // Create a content container
    const contentContainer: HTMLDivElement = document.createElement("div");
    contentContainer.id = "activation-requisition-container";
    contentContainer.style.color = "#363448";

    // Add content to the container
    const heading: HTMLDivElement = document.createElement("div");
    heading.textContent = "Connect your wallet";
    heading.style.fontSize = "24px";
    heading.style.fontWeight = "600";
    heading.style.lineHeight = "36px";
    heading.style.color = "#8549B6";

    const logo = createLogoImage();

    const closeIcon = createCloseIcon();
    closeIcon.id = "activation-requisition-close-icon";
    closeIcon.style.position = "absolute";
    closeIcon.style.top = "24px";
    closeIcon.style.right = "24px";
    closeIcon.style.cursor = "pointer";

    // create a toast
    const toast = document.createElement("div");
    toast.id = "activation-toast";
    toast.style.position = "absolute";
    toast.style.backgroundColor = "#FFFFFF";
    toast.style.color = "#363448";
    toast.style.padding = "12px";
    toast.style.borderRadius = "12px";
    toast.style.display = "none";
    toast.style.textAlign = "center";
    toast.style.fontSize = "14px";
    toast.style.fontWeight = "400";
    toast.style.boxShadow =
      "0px 0px 25px -5px rgba(0, 0, 0, 0.08), 0px 0px 10px -5px rgba(0, 0, 0, 0.04)";
    contentContainer.appendChild(toast);

    // Create loading section
    const loadingSection = createLoadingSection("activation-loading");
    loadingSection.style.display = "none";

    // Create a mobile section
    const mobileSection = await this.createMobileContainer(requisitionInfo);

    // Create a desktop section
    const desktopSection = this.createDesktopContainer(waxObj);

    // Append content to the container
    contentContainer.appendChild(closeIcon);
    contentContainer.appendChild(logo);
    contentContainer.appendChild(heading);
    contentContainer.appendChild(mobileSection);
    contentContainer.appendChild(desktopSection);
    contentContainer.appendChild(loadingSection);

    // Set styles for modal content
    contentContainer.style.backgroundColor = "white";
    contentContainer.style.padding = "32px"; // Adjust padding as needed
    contentContainer.style.borderRadius = "24px"; // Add rounded corners if desired
    contentContainer.style.position = "absolute";
    contentContainer.style.top = "50%";
    contentContainer.style.left = "50%";
    contentContainer.style.transform = "translate(-50%, -50%)";
    contentContainer.style.display = "inline-flex";
    contentContainer.style.flexDirection = "column";
    contentContainer.style.alignItems = "center";
    contentContainer.style.gap = "24px";
    contentContainer.style.minWidth = "376px";

    return contentContainer;
  }

  public static createSessionActivatedContent(userAccount: string) {
    const element = document.createElement("div");
    // linkContainer.href = `https://stg-wallet-ui.waxstg.net/dapp-activate=${requisitionInfo.code}`;
    // linkContainer.target = "_blank";

    element.textContent = userAccount;

    // linkContainer.style.display = "flex";
    // linkContainer.style.flexDirection = "column";
    // linkContainer.style.gap = "8px";
    // linkContainer.style.backgroundColor = "#F5F4FF";
    // linkContainer.style.padding = "16px 24px";
    // linkContainer.style.width = "100%";
    // linkContainer.style.alignItems = "center";
    // linkContainer.style.borderRadius = "16px";
    // linkContainer.style.color = "#363448";
    // linkContainer.style.textDecoration = "none";

    // const layout = createFlexDiv("column", "8px");
    // const text = document.createElement("div");
    // text.style.fontWeight = "700";
    // text.textContent = "My Cloud Wallet";

    // layout.appendChild(text);
    // linkContainer.appendChild(layout);
    return element;
  }

  private static createRequisitionExpiredContainer() {
    const container = createFlexDiv("column", "8px");
    container.id = "activation-expired-section";
    container.style.width = "100%";

    const qrExpiredDiv = document.createElement("div");
    qrExpiredDiv.style.color = "#BA4300";
    qrExpiredDiv.style.fontSize = "14px";
    qrExpiredDiv.style.background = "rgba(216, 107, 46, 0.12)";
    qrExpiredDiv.style.padding = "16px";
    qrExpiredDiv.style.borderRadius = "8px";

    const textWithInfoIcon = createTextWithIcon(
      "QR code has expired",
      createExpiredIcon()
    );
    textWithInfoIcon.style.fontSize = "400";
    qrExpiredDiv.appendChild(textWithInfoIcon);

    const generateButton = createButton(
      "requisition-generate-new-code",
      "Generate new code"
    );

    container.appendChild(qrExpiredDiv);
    container.appendChild(generateButton);
    return container;
  }
  private static async generateQRCodeImage(content: string) {
    const qrCode = new QRCode({
      content,
      padding: 0,
      width: 192,
      height: 192,
      color: "#000000",
      background: "transparent",
      ecl: "M",
    });

    // Create the SVG element
    const qrCodeSVG = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    qrCodeSVG.setAttribute("width", "192");
    qrCodeSVG.setAttribute("height", "192");

    // Append the QRCode's SVG content to the SVG element
    qrCodeSVG.innerHTML = qrCode.svg();

    return qrCodeSVG;
  }

  private static createReGenerateRequisitionInfoButton() {
    const button: HTMLButtonElement = document.createElement("button");
    button.id = "regenerate-requisition-info-button";
    button.textContent = "Regenerate";
    button.disabled = true;
    return button;
  }

  private static async createMobileContainer(requisitionInfo: RequisitionInfo) {
    const container = createFlexDiv("column", "8px");
    container.id = "activation-mobile-section";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = "center";
    container.style.boxSizing = "border-box";
    container.style.width = "100%";

    const heading = createFlexDiv("row");
    heading.style.justifyContent = "space-between";
    heading.style.alignItems = "center";
    heading.style.width = "100%";
    const textWithMobileIcon = createTextWithIcon("Mobile", createMobileIcon());
    const textWithScanIcon = createTextWithIcon(
      "Scan with your wallet",
      createScanIcon()
    );
    textWithScanIcon.style.color = "#7A7A7A";
    heading.append(...[textWithMobileIcon, textWithScanIcon]);

    // create expired section
    const requisitionExpiredSection = this.createRequisitionExpiredContainer();
    requisitionExpiredSection.style.display = "none";

    const qrSection = createFlexDiv("column", "24px");
    qrSection.style.padding = "40px 24px 24px";
    qrSection.style.alignItems = "center";
    qrSection.style.borderRadius = "16px";
    qrSection.style.backgroundColor = "#F5F4FF";

    const qrCodeImage = await this.generateQRCodeImage(
      `${requisitionInfo.qrCodeContent}`
    );
    const codeSection = createFlexDiv("row", "8px");
    codeSection.style.fontWeight = "600";
    codeSection.style.color = "#363448";
    codeSection.style.cursor = "pointer";
    codeSection.style.borderBottom = "1px solid #363448";

    const codeSpan = document.createElement("span");
    codeSpan.textContent = "Copy";

    const copyIcon = createCopyIcon();

    codeSection.appendChild(codeSpan);
    codeSection.appendChild(copyIcon);

    // copy event listener
    codeSection.addEventListener("click", () => {
      copyToClipboard(requisitionInfo.qrCodeContent);
    });

    qrSection.appendChild(qrCodeImage);
    qrSection.appendChild(codeSection);

    const expiration = Math.round(
      (requisitionInfo.expire * 1000 - Date.now()) / (1000 * 60)
    );
    const expirationText = createFlexDiv("row");
    expirationText.textContent = `QR code will be expired in ${expiration} mins`;
    expirationText.style.color = "#7A7A7A";
    expirationText.style.fontWeight = "600";
    expirationText.style.justifyContent = "center";

    const scanningSection = createFlexDiv("column", "8px");
    scanningSection.id = "activation-scanning-section";
    scanningSection.style.width = "100%";
    scanningSection.style.boxSizing = "border-box";

    scanningSection.appendChild(qrSection);
    scanningSection.appendChild(expirationText);

    container.appendChild(heading);
    container.appendChild(scanningSection);
    container.appendChild(requisitionExpiredSection);
    return container;
  }

  private static createDesktopContainer(waxObj: WaxJS) {
    const container = createFlexDiv("column", "8px");
    container.id = "activation-desktop-section";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "8px";
    container.style.boxSizing = "border-box";
    container.style.width = "100%";
    const textWithDesktopIcon = createTextWithIcon(
      "Desktop",
      createDesktopIcon()
    );

    const linkContainer = document.createElement("div");
    linkContainer.style.display = "flex";
    linkContainer.style.flexDirection = "column";
    linkContainer.style.gap = "8px";
    linkContainer.style.backgroundColor = "#F5F4FF";
    linkContainer.style.padding = "16px 24px";
    linkContainer.style.width = "100%";
    linkContainer.style.alignItems = "center";
    linkContainer.style.borderRadius = "16px";
    linkContainer.style.color = "#363448";
    linkContainer.style.boxSizing = "border-box";
    linkContainer.style.cursor = "pointer";

    // login event listener
    linkContainer.addEventListener("click", async () => {
      await waxObj.login();
    });

    const layout = createFlexDiv("column", "8px");
    layout.style.alignItems = "center";
    layout.style.justifyContent = "center";

    const logoIcon = createLogoIcon();

    const text = document.createElement("div");
    text.style.fontWeight = "700";
    text.textContent = "My Cloud Wallet";

    layout.appendChild(logoIcon);
    layout.appendChild(text);

    linkContainer.appendChild(layout);

    container.appendChild(textWithDesktopIcon);
    container.appendChild(linkContainer);
    return container;
  }
}
