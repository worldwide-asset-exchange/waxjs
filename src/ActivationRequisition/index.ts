import { WaxJS } from "..";
import { ILoginResponse, IWhitelistedContract } from "../interfaces";
import { ModalOpener } from "./../Modal/ModalOpener";
import { Content } from "./Content";
import { API, Amplify, graphqlOperation } from 'aws-amplify';
import { GraphQLSubscription } from '@aws-amplify/api';

// export const LS_ACTIVATION_KEY = 'dapp_activated';

declare global {
  interface Window {
    closeCustomPopup?: () => void;
  }
}

const publish2channel = /* GraphQL */ `
    mutation Publish2channel($data: AWSJSON!, $name: String!) {
        publish2channel(data: $data, name: $name) {
            data
            name
            __typename
        }
    }
`;

type Subscribe2channelSubscription = {
  subscribe2channel?: {
    __typename: 'Channel';
    data: string;
    name: string;
  } | null;
};

export interface RequisitionInfo {
  code: string;
  qrCodeContent: string;
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
  userAccount?: string;
}

export interface TransactionInfo {
  actions: any;
}

export interface TransactionResult {
  status: 'approved' | 'rejected' | 'error';
  result?: any;
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


  constructor(
    readonly activationEndpoint: string,
    readonly waxObj: WaxJS,
    readonly relayEndpoint: string,
    readonly relayRegion: string
  ) {
    this.activationEndpoint = activationEndpoint;

    const myAppConfig = {
      aws_appsync_graphqlEndpoint: relayEndpoint,
      aws_appsync_region: relayEndpoint,
      aws_appsync_authenticationType: 'AWS_LAMBDA',
    };
    Amplify.configure(myAppConfig);
  }

  public deactivate(): void {
    this.user = null;
  }

  public async openModal() {
    const requisitionInfo: RequisitionInfo = await this.fetchActivationInfo(
      document.location.host
    );
    this.content = await Content.createContent(requisitionInfo, this.waxObj);
    this.modalOpener = new ModalOpener(this.content);
    this.modalOpener.openModal();
    return this.checkActivation(requisitionInfo);
  }

  public async signTransaction(transaction: any) {
    // const activatedDate = JSON.parse(localStorage.getItem(LS_ACTIVATION_KEY));
    const { token } = this.user;
    const txInfo: TransactionInfo = {
      actions: transaction,
    };
    const res = API.graphql(
      graphqlOperation(
        publish2channel,
        {
          name: `tx_${this.user.account}`,
          data: JSON.stringify(txInfo),
        },
        JSON.stringify({
          account: this.user.account,
          token: token,
          svc: document.location.host,
          mode: 'dapp',
        }),
      ),
    );
    return new Promise((resolve, reject) => {
      let subscription;
      console.log(`start listening...`)
      try {
        const query = `
            subscription Subscribe2channel($name: String!) {
                subscribe2channel(name: $name) {
                    data
                    name
                    __typename
                }
            }
        `
        //Subscribe via WebSockets
        const graphqlOption = graphqlOperation(
          query,
          {
            name: `txres_${this.user.account}`,
          },
          JSON.stringify({
            account: this.user.account,
            token: token,
            svc: document.location.host,
            mode: 'dapp',
          }),
        );

        subscription = API.graphql<GraphQLSubscription<Subscribe2channelSubscription>>(
          graphqlOption,
        ).subscribe({
          next: ({ provider: _, value }) => {
            const txRes: TransactionResult = JSON.parse(value.data.subscribe2channel.data);
            switch (txRes.status) {
              case 'approved':
                resolve(txRes);
                break;
              case'rejected':
                reject(new Error('User rejected the transaction'));
                break;
              default:
                reject(new Error('Unknown status'));
                break;
            }
            subscription?.unsubscribe();
          },
          error: error => {
            subscription?.unsubscribe();
            reject(error);
          },
        });
      } catch (error) {
        subscription?.unsubscribe();
        reject(error);
      }
    });
  }

  private async updateModal() {
    const requisitionInfo: RequisitionInfo = await this.fetchActivationInfo(
      document.location.host
    );
    this.content = await Content.createContent(requisitionInfo, this.waxObj);
    this.modalOpener.updateContent(this.content);
    this.checkActivation(requisitionInfo);
  }

  private async updateActivationContent() {
    const loadingSection: HTMLDivElement = this.content.querySelector(
      "#activation-loading"
    );
    const activationMobileSection: HTMLDivElement = this.content.querySelector(
      "#activation-mobile-section"
    );
    const activationDesktopSection: HTMLDivElement = this.content.querySelector(
      "#activation-desktop-section"
    );

    loadingSection.style.display = "flex";
    activationMobileSection.style.display = "none";
    activationDesktopSection.style.display = "none";

    setTimeout(() => {
      this.modalOpener.closeModal();
    }, 2000);
  }

  private async checkActivation(requisitionInfo: RequisitionInfo) {
    try {
      const activatedData = await this.checkIfActivated(
        requisitionInfo,
        document.location.host
      );
      if (!!activatedData) {
        // Display success status in ActivationContent then eventually modalOpener.closeModal();
        this.user = activatedData;

        this.updateActivationContent();
        return this.user;
      }
    } catch (error) {
      if (
        error instanceof ActivationExpiredError ||
        error instanceof InvalidCodeError
      ) {
        const activationExpiredSection: HTMLDivElement = this.content.querySelector(
          "#activation-expired-section"
        );
        activationExpiredSection.style.display = "flex";

        const activationScanningSection: HTMLDivElement = this.content.querySelector(
          "#activation-scanning-section"
        );
        activationScanningSection.style.display = "none";

        const regenerateButton: HTMLDivElement = this.content.querySelector(
          "#requisition-generate-new-code"
        );

        if (regenerateButton) {
          regenerateButton.addEventListener("click", async () => {
            await this.updateModal();
          });
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
      }, 5_000);
    });
  }
}
