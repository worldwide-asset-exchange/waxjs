import { JsonRpc } from "eosjs";
import { ecc } from "eosjs/dist/eosjs-ecc-migration";
import { getProofWaxRequiredKeys } from "./helpers";
import { ILoginResponse, IWhitelistedContract } from "./interfaces";
import { WaxEventSource } from "./WaxEventSource";

export class WaxActivateRequisition {
  private waxEventSource: WaxEventSource;

  private user?: ILoginResponse;

  private whitelistedContracts?: IWhitelistedContract[];

  private nonce: string = "";

  constructor(
    readonly walletURL: string,
    readonly rpc: JsonRpc,
    readonly returnTempAccount?: boolean
  ) {
    this.waxEventSource = new WaxEventSource(walletURL);
    this.returnTempAccount = returnTempAccount;
    this.walletURL = walletURL;
    this.rpc = rpc;
  }
  public disActivate(): void {
    this.user = null;
  }

  public async activateRequisition(nonce?: string): Promise<ILoginResponse> {
    if (!this.user) {
      this.nonce = nonce;
      await this.activateRequisitionWindow(this.nonce);
    }

    if (this.user) {
      return this.user;
    }

    throw new Error("Activation failed");
  }

  public async activateRequisitionWindow(nonce: string): Promise<any> {
    const verifyUrl = `${this.walletURL}/cloud-wallet/activate-requisition`;
    const referWindow: Window = await this.waxEventSource.openEventSource(
      verifyUrl,
      {
        type: "ACTIVATE_REQUISITION",
        nonce,
      }
    );
    return this.waxEventSource.onceEvent(
      referWindow,
      this.walletURL,
      this.receiveActivation.bind(this),
      undefined
    );
  }

  private async receiveActivation(event: { data: any }): Promise<boolean> {
    const {
      verified,
      userAccount,
      pubKeys,
      whitelistedContracts,
      isTemp,
      createData,
      avatar_url: avatarUrl,
      trustScore,
      proof,
    } = event.data;
    let isProofVerified = false;
    if (!verified) {
      throw new Error("User declined to share their user account");
    }

    if (!userAccount || !pubKeys) {
      throw new Error("User does not have a blockchain account");
    }
    if (proof?.verified && this.nonce) {
      // handle proof logic
      const message = `cloudwallet-verification-${proof.data.referer}-${this.nonce}-${userAccount}`;
      isProofVerified = ecc.verify(
        proof.data.signature,
        message,
        await getProofWaxRequiredKeys(this.rpc.endpoint)
      );
    }

    this.whitelistedContracts = whitelistedContracts || [];
    this.user = {
      account: userAccount,
      keys: pubKeys,
      isTemp,
      createData,
      avatarUrl,
      trustScore,
      isProofVerified,
    };
    return true;
  }
}
