import { ILoginResponse, IWhitelistedContract } from "../interfaces";
import { ModalOpener } from "./../Modal/ModalOpener";
import { Content } from "./Content";

declare global {
  interface Window {
    closeCustomPopup?: () => void;
  }
}

export interface RequisitionInfo {
  code: string;
  expire: number;
}

interface ActivatedData {
  account: string;
  keys: string[];
  isTemp?: boolean;
  createData?: any;
  avatarUrl?: string;
  trustScore?: number;
  isProofVerified?: any;
  token: string;
}

class ActivationFetchError extends Error {
  constructor(message = "") {
    super(message);
    this.name = "ActivationFetchError";
  }
}

class ActivationExpiredError extends Error {
  constructor(message = "") {
    super(message);
    this.name = "ActivationExpiredError";
  }
}

class InvalidCodeError extends Error {
  constructor(message = "") {
    super(message);
    this.name = "InvalidCodeError";
  }
}

export class WaxActivateRequisition {
  private user?: ILoginResponse;
  private modalOpener: ModalOpener | null;
  private content: HTMLDivElement;

  constructor(readonly activationEndpoint: string) {
    this.activationEndpoint = activationEndpoint;
  }

  public deactivate(): void {
    this.user = null;
  }

  public async openModal() {
    const requisitionInfo: RequisitionInfo = await this.fetchActivationInfo(
      document.location.origin
    );
    this.content = await Content.createContent(requisitionInfo);
    this.modalOpener = new ModalOpener(this.content);
    this.modalOpener.openModal();
    this.checkActivation(requisitionInfo);
  }

  private async updateModal() {
    const requisitionInfo: RequisitionInfo = await this.fetchActivationInfo(
      document.location.origin
    );
    this.content = await Content.createContent(requisitionInfo);
    this.modalOpener.updateContent(this.content);
    this.checkActivation(requisitionInfo);
  }

  private async checkActivation(requisitionInfo: RequisitionInfo) {
    try {
      const activatedData = await this.checkIfActivated(
        requisitionInfo,
        document.location.origin
      );
      if (!!activatedData) {
        // Display success status in ActivationContent then eventually modalOpener.closeModal();
        const { token, ...loginResponse } = activatedData;
        this.user = loginResponse;
        return this.user.account;
      }
    } catch (error) {
      if (
        error instanceof ActivationExpiredError ||
        error instanceof InvalidCodeError
      ) {
        const regenerateButton: HTMLButtonElement = this.content.querySelector(
          "#regenerate-requisition-info-button"
        );

        if (regenerateButton) {
          regenerateButton.addEventListener("click", async () => {
            await this.updateModal();
          });
          regenerateButton.disabled = false;
        }
      } else {
        // Output other errors
      }
    }
  }

  private async fetchActivationInfo(origin: string): Promise<RequisitionInfo> {
    try {
      const response = await fetch(
        `${this.activationEndpoint}/dapp/code?dapp=${origin}`
      );

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Fetch error:", error);
      throw new ActivationFetchError();
    }
  }

  private async checkIfActivated(
    requisitionInfo: RequisitionInfo,
    origin
  ): Promise<ActivatedData> {
    return new Promise<ActivatedData>((resolve, reject) => {
      const intervalId = setInterval(async () => {
        const currentTimestamp = Math.floor(Date.now() / 1000);

        if (currentTimestamp > requisitionInfo.expire) {
          console.log(
            "Current time is greater than expiration. Stopping pulling checkActivation.",
            currentTimestamp,
            requisitionInfo.expire
          );
          clearInterval(intervalId);
          reject(new ActivationExpiredError());
        }

        try {
          const response = await fetch(
            `${this.activationEndpoint}/dapp/code/check?dapp=${origin}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                code: requisitionInfo.code,
              }),
            }
          );

          if (response.status === 422) {
            reject(new InvalidCodeError());
            return;
          }

          if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status}`);
          }

          const data = await response.json();

          console.log("data", data);

          if (response.status === 202) {
            console.log("Continuing pulling checkActivation");
          } else if (response.status === 200) {
            console.log("Stopping pulling checkActivation");
            clearInterval(intervalId);
            resolve(data);
            // Do something with the data, e.g., update state or trigger some action
            // Example: return a promise that resolves with the data
            // return Promise.resolve(data);
          }
        } catch (error) {
          console.error("Error checking activation:", error);

          clearInterval(intervalId);
          reject(error);
        }
      }, 15_000);
    });
  }
}
