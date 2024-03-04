import * as QRCode from "qrcode";
import { RequisitionInfo } from "./index";

export class Content {
  public static async createContent(
    requisitionInfo: RequisitionInfo
  ): Promise<HTMLDivElement> {
    console.log("requisitionInfo", requisitionInfo);
    // Create a content container
    const contentContainer: HTMLDivElement = document.createElement("div");
    contentContainer.id = "activation-requisition-container";

    // Add content to the container
    const heading: HTMLHeadingElement = document.createElement("h2");
    heading.textContent = "Connect your wallet";

    const paragraph: HTMLParagraphElement = document.createElement("p");
    paragraph.textContent = "[Mobile] Scan with your wallet";
    const qrCodeImage: HTMLImageElement = await this.generateQRCodeImage(
      `https://myclouldwallet.com/dapp-activate=${requisitionInfo.code}`
    );

    const reGenerateRequisitionInfoButton =
      this.createReGenerateRequisitionInfoButton();
    const requisitionInfoStatusDiv = this.createRequisitionInfoStatusDiv();
    // Append content to the container
    contentContainer.appendChild(heading);
    contentContainer.appendChild(paragraph);
    contentContainer.appendChild(qrCodeImage);
    contentContainer.appendChild(reGenerateRequisitionInfoButton);
    contentContainer.appendChild(requisitionInfoStatusDiv);

    // Set styles for modal content
    contentContainer.style.backgroundColor = "white";
    contentContainer.style.padding = "20px"; // Adjust padding as needed
    contentContainer.style.borderRadius = "10px"; // Add rounded corners if desired
    contentContainer.style.position = "absolute";
    contentContainer.style.top = "50%";
    contentContainer.style.left = "50%";
    contentContainer.style.transform = "translate(-50%, -50%)";

    return contentContainer;
  }

  private static async generateQRCodeImage(
    text: string
  ): Promise<HTMLImageElement> {
    const qrCodeDataURL: string = await QRCode.toDataURL(text);
    const qrCodeImage: HTMLImageElement = document.createElement("img");
    qrCodeImage.src = qrCodeDataURL;

    return qrCodeImage;
  }

  private static createReGenerateRequisitionInfoButton() {
    const button: HTMLButtonElement = document.createElement("button");
    button.id = "regenerate-requisition-info-button";
    button.textContent = "Regenerate";
    button.disabled = true;
    return button;
  }

  private static createRequisitionInfoStatusDiv(statusText: string = "") {
    const statusDiv: HTMLDivElement = document.createElement("div");
    statusDiv.id = "requisition-info-status";
    statusDiv.textContent = statusText;

    statusDiv.style.fontSize = "16px";
    statusDiv.style.fontWeight = "bold";
    statusDiv.style.color = "blue";

    return statusDiv;
  }
}
