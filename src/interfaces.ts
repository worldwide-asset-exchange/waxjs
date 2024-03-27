export interface IWhitelistedContract {
  contract: string;
  domain: string;
  recipients: string[];
}

export interface ISigningResponse {
  serializedTransaction: Uint8Array;
  signatures: string[];
}

export interface ILoginResponse {
  account: string;
  keys: string[];
  isTemp?: boolean;
  createData?: any;
  avatarUrl?: string;
  trustScore?: number;
  isProofVerified?: any;
  token?: string;
}
