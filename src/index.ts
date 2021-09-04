import {Api, JsonRpc} from "eosjs";
import {SignatureProvider, Transaction} from "eosjs/dist/eosjs-api-interfaces";
import {ILoginResponse} from "./interfaces";
import {WaxSigningApi} from "./WaxSigningApi";

export class WaxJS {
    public readonly rpc: JsonRpc;

    public api: Api;
    public user?: ILoginResponse;

    private signingApi: WaxSigningApi;

    private readonly apiSigner: SignatureProvider;
    private readonly waxSigningURL: string;
    private readonly waxAutoSigningURL: string;
    private readonly eosApiArgs: any;
    private readonly freeBandwidth: boolean;
    private readonly verifyTx: (
        user: ILoginResponse,
        originalTx: Transaction,
        augmentedTx: Transaction
    ) => void;

    constructor({
                    rpcEndpoint,
                    tryAutoLogin = true,
                    userAccount,
                    pubKeys,
                    apiSigner,
                    waxSigningURL = "https://all-access.wax.io",
                    waxAutoSigningURL = "https://api-idm.wax.io/v1/accounts/auto-accept/",
                    eosApiArgs = {},
                    freeBandwidth = true,
                    verifyTx = defaultTxVerifier
                }: {
        rpcEndpoint: string;
        userAccount?: string;
        pubKeys?: string[];
        tryAutoLogin?: boolean;
        apiSigner?: SignatureProvider;
        waxSigningURL?: string;
        waxAutoSigningURL?: string;
        eosApiArgs?: any;
        freeBandwidth?: boolean;
        verifyTx?: (user: ILoginResponse, originalTx: Transaction, augmentedTx: Transaction) => void;
    }) {
        this.signingApi = new WaxSigningApi(waxSigningURL, waxAutoSigningURL);
        this.rpc = new JsonRpc(rpcEndpoint);
        this.waxSigningURL = waxSigningURL;
        this.waxAutoSigningURL = waxAutoSigningURL;
        this.apiSigner = apiSigner;
        this.eosApiArgs = eosApiArgs;
        this.freeBandwidth = freeBandwidth;
        this.verifyTx = verifyTx;

        if (userAccount && Array.isArray(pubKeys)) {
            // login from constructor
            this.receiveLogin({account: userAccount, keys: pubKeys});
        } else {
            // try to auto-login via endpoint
            if (tryAutoLogin) {
                this.signingApi.tryAutologin().then(async (response) => {
                    if (response) {
                        this.receiveLogin(await this.signingApi.login());
                    }
                });
            }
        }
    }

    public async login(): Promise<string> {
        if (!this.user) {
            this.receiveLogin(await this.signingApi.login())
        }

        return this.user.account;
    }

    public async isAutoLoginAvailable(): Promise<boolean> {
        if (this.user) {
            return true;
        } else if (await this.signingApi.tryAutologin()) {
            this.receiveLogin(await this.signingApi.login());

            return true;
        }

        return false;
    }

    private receiveLogin(data: ILoginResponse): void {
        this.user = data;

        const signatureProvider: SignatureProvider = {
            getAvailableKeys: async () => {
                return [
                    ...this.user.keys,
                    ...((this.apiSigner && (await this.apiSigner.getAvailableKeys())) ||
                        [])
                ];
            },
            sign: async (sigArgs) => {
                const originalTx = await this.api.deserializeTransactionWithActions(
                    sigArgs.serializedTransaction
                );

                const {
                    serializedTransaction,
                    signatures
                } = await this.signingApi.signing(originalTx, sigArgs.serializedTransaction, !this.freeBandwidth);


                const augmentedTx = await this.api.deserializeTransactionWithActions(
                    serializedTransaction
                );

                this.verifyTx(this.user, originalTx, augmentedTx);

                sigArgs.serializedTransaction = serializedTransaction;

                return {
                    serializedTransaction,
                    signatures: [
                        ...signatures,
                        ...((this.apiSigner &&
                            (await this.apiSigner.sign(sigArgs)).signatures) ||
                            [])
                    ]
                };
            }
        };

        this.api = new Api({
            ...this.eosApiArgs,
            rpc: this.rpc,
            signatureProvider
        });
        const transact = this.api.transact.bind(this.api);
        // We monkeypatch the transact method to overcome timeouts
        // firing the pop-up which some browsers enforce, such as Safari.
        // By pre-creating the pop-up window we will interact with,
        // we ensure that it is not going to be rejected due to a delayed
        // pop up that would otherwise occur post transaction creation
        this.api.transact = async (transaction, namedParams) => {
            await this.signingApi.prepareTransaction(transaction);

            return await transact(transaction, namedParams);
        };
    }
}

function defaultTxVerifier(
    user: ILoginResponse,
    originalTx: Transaction,
    augmentedTx: Transaction
): void {
    const {actions: originalActions} = originalTx;
    const {actions: augmentedActions} = augmentedTx;

    if (
        JSON.stringify(originalActions) !==
        JSON.stringify(
            augmentedActions.slice(augmentedActions.length - originalActions.length)
        )
    ) {
        throw new Error(
            `Augmented transaction actions has modified actions from the original.\nOriginal: ${JSON.stringify(
                originalActions,
                undefined,
                2
            )}\nAugmented: ${JSON.stringify(augmentedActions, undefined, 2)}`
        );
    }

    for (const extraAction of augmentedActions.slice(
        0,
        augmentedActions.length - originalActions.length
    )) {
        const userAuthedAction = extraAction.authorization.find((auth: any) => {
            return auth.actor === user.account;
        });

        if (userAuthedAction) {
            throw new Error(
                `Augmented transaction actions has an extra action from the original authorizing the user.\nOriginal: ${JSON.stringify(
                    originalActions,
                    undefined,
                    2
                )}\nAugmented: ${JSON.stringify(augmentedActions, undefined, 2)}`
            );
        }
    }
}
