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
}
