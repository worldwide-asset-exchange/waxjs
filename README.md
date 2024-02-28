# waxjs

Javascript API for integration with the WAX Cloud Wallet.

## Documentation

[Check the WAX developer portal for full instructions](https://developer.wax.io/build/cloud-wallet/waxjs/)

## Installation

### Browser

Grab the waxjs.js minified bundle in the dist-web folder of this repo, or build it yourself (see below). [Check the demo code](https://github.com/worldwide-asset-exchange/waxjs/blob/develop/dist-web/index.html) to see how to use it.

### NPM

```bash
npm install @waxio/waxjs
```

### YARN

```bash
yarn add @waxio/waxjs
```

## Usage

### 0. Import (for NPM and Yarn installations)

React style apps using npm or yarn can import the library via:

```js
import * as waxjs from "@waxio/waxjs/dist";
```

### 1. Instantiate

Instantiate the waxjs object with the WAX RPC server you wish to connect to.

```js
const wax = new waxjs.WaxJS({
  rpcEndpoint: 'https://wax.greymass.com'
});
```

The library can also be instantiated with the user account and the public keys. Due to the library contains the user information, the login step can be avoided.

```js
const wax = new waxjs.WaxJS({
  rpcEndpoint: 'https://wax.greymass.com',
  userAccount: 'user1',
  pubKeys: ['EOS7rC8jFvFrPYDqp3Nh3HdRfL79h11B1JhPEXy85enF5wwYzF3Hk']
});
```

If you want to handle the auto-login on your side with the ```isAutoLoginAvailable``` function (to avoid waiting for the user to click a button), you can disable the auto-login function in the constructor (so it won't get called twice).

```js
const wax = new waxjs.WaxJS({
  rpcEndpoint: 'https://wax.greymass.com',
  tryAutoLogin: false
});
```

### 2. Login

Log your user in so as to access their wax account name for creating transactions.

```js
const userAccount = await wax.login();
```

Successful login will return the userAccount. It will also be available as the ```userAccount``` member on the ```wax``` instance. You can now use the eosjs ```api``` member...

#### 2.1 Login combining proof system

We could also combine proof system inside wax.login by passing optional nonce parameter onto the function

```js
const nonce = 'your_nonce_string';
const userAccount = await wax.login(nonce);
```

later on we could get proof status of user by calling:

```js
const proofVerified = wax.proofVerified; // return true or false
```

### 3. Use the eosjs Objects As Usual

Utilize the eosjs ```api``` and ```rpc``` members available on the ```wax``` instance. They are instances of the regular eosjs objects, Api, and JsonRpc, so you can do anything with them that eosjs already provides. [Check the eosjs docs and repo](https://github.com/EOSIO/eosjs) for more info.

The api method will not be initialized until you login your user, and remember that the user's account name is available as the ```userAccount``` member on the ```wax``` instance.

```js
const result = await wax.api.transact({
  actions: [{
    account: 'eosio.token',
    name: 'transfer',
    authorization: [{
      actor: wax.userAccount,
      permission: 'active',
    }],
    data: {
      from: wax.userAccount,
      to: 'eosio',
      quantity: '0.00000001 WAX',
      memo: '',
    },
  }]
}, {
  blocksBehind: 3,
  expireSeconds: 1200,
});
```

## Constructor Options

* **rpcEndpoint**: The WAX public node API endpoint URL you wish to connect to. *Required*
* **tryAutoLogin**: Always attempt to autologin when your dapp starts up. Default **true**
* **userAccount**: User account to start up with. *Optional*
* **pubKeys**: Public keys for the userAccount manually specified above. *Optional*.
* **apiSigner**: Custom signing logic. Note that free bandwidth will not be provided to custom signers. Default *Optional*
* **eosApiArgs**: Custom [eosjs](https://github.com/EOSIO/eosjs) constructor arguments to use when instantiating eosjs. *Optional*
* **freeBandwidth**: Request bandwidth management from WAX. Default **true**
* **feeFallback**: Add wax fee action if user exhausted their own bandwidth, the free boost. Default **true**
* **verifyTx**: Verification function that you can override to confirm that your transactions received from WAX are only modified with bandwidth management actions, and that your transaction is otherwise unaltered. The function signature is ```(userAccount: string,  originalTx: any, augmentedTx: any) => void```. Where ```userAccount``` is the account being signed for, ```originalTx``` is the tx generated by your dapp, and ```augmentedTx``` is the potentially bandwidth-managed altered tx you will receive from WAX. The default verifier does this for you, and you should check this to be confident that the verifier is sufficiently rigorous. *Optional*
* **metricsUrl**: used by WAXIO to gather metrics about failed transaction, times it takes to load a transaction. Default *Optional*
* **returnTempAccounts**: using this flag will return temporary accounts or accounts that have signed up for a cloud wallet but not paid the introduction fee to get a blockchain account created. When this is set to true, using the doLogin function will return blockchain account name that may not exist in the blockchain but it will also return an extra boolean flag called isTemp. If this flag is true it is a temporary account, it does not exist in the blockchain yet. If this constructor option is false then only accounts which have been activated and have a blockchain account will be returned.
* **chainName**: config to specify chain name in case switch chain on construct
* **registryEndpoint**: custom to point to specic registry endpoint instead of `rpcEndpoint`
* **chainId**: combination with `chainName` and `registryEndpoint` to switch chain

## Temporary Accounts

Temporary accounts are users that have signed up for a wallet account, but have not paid the entry fee to get the blockchain account created.
We allow waxjs to return accounts using the `returnTempAccounts` contructor argument, by then dapps can create an account on behalf of the user or have a custom signup flow if they want.

For example:

`returnTempAccounts` = true, User with temporary account can login and try out the dApp without using any blockchain function

`returnTempAccounts` = false, this means the waxjs library will only return accounts for users who have a block chain account. People who have already paid the creation fee

### Identify user with temporary account (no blockchain account)

After the wax.login() call you can check if an account is temporary using wax.isTemp(), remember this will only ever can be true if allowTemporaryAccounts is set to true, or else waxjs will never return temporary accounts.

### Create blockchain account on behalf of the user

To create blockchain account on behalf of the user, dApp owners can send ```5 WAXP```( get the latest value from [here](https://waxblock.io/account/newuser.wax?code=newuser.wax&scope=newuser.wax&table=settings&lower_bound=createval&upper_bound=createval&limit=10#contract-tables) ) to ```newuser.wax``` with the MEMO = ```userAccount```.

There is a refund system in place if you pay more than the account creation fee, the extra amount will be refunded to the newly created account. eg: you send ```8 WAXP``` to ```newuser.wax``` for a new account named: ```new.wam``` after the new account ```new.wam``` is created it will get ```3 WAXP``` refunded. There is a maximum amount that will be refunded, it can be found [here](https://waxblock.io/account/newuser.wax?code=newuser.wax&scope=newuser.wax&table=settings&lower_bound=maxrefund&upper_bound=maxrefund&limit=10#contract-tables)

If you want to get the latest account creation fee from the blockchain you can get it from waxjs. After the user has logged in you can call ```waxjs.createInfo``` this will return an object like this :
```
{
    "contract": "eosio.token",
    "message": "Create the user's blockchain account ds.k.wam by sending 5 WAX to newuser.wax with the memo as the one mentioned below.",
    "amount": "5.00000000 WAX",
    "memo": "dsDOTkDOTwam"
}
```
**This is only be returned if the account is temporary so check that the account is temporary using ```waxjs.isTemp``` before you call ```waxjs.createInfo```**

For example:

User login with temporary account, and their ```userAccount``` = ```hfhf.wam```
Dapps can send ```5 WAXP``` (current account creation fee) to ```newuser.wax``` , with ```MEMO``` = ```hfhf.wam```
Then the blockchain account of the user would be created, and they can start using all the blockchain features.

## Free Bandwidth

So long as waxjs is initialized with ```freeBandwidth = true``` (this is the default), your dapp will take advantage of freebandwidth provided by WAX, up to 5ms of CPU and 5K words per user per 24 hours, and tentatively 50s per contract per 24 hrs.

Dapps that require more bandwidth will be able to register their own bandwidth via the [bandwidth registration contract](https://wax.bloks.io/account/boost.wax?loadContract=true&tab=Actions&account=boost.wax&scope=boost.wax&limit=100&action=reg). More info on registering for extra bandwidth management can be found [here](https://github.com/worldwide-asset-exchange/boost.wax).

## Logout

You can now log a user out of the waxjs library, this is usefull if you want to logout one user and let them login with another account.

To do this just call `wax.logout()` that will be enough.

## Proof System

Sometimes it is important to verify that the current logged in user is legitimate.

We do this by checking the that the current session belongs to the user account that you have in your dapp.

There are two ways to check this using `waxProof(nonce,verify = true)` Function and `userAccountProof(nonce,description,verify = true)`

Both of these functions will need a nonce, which is a string that you generate on your side and send it to be signed.

An extra parameter called description is needed for `userAccountProof` but not used right now.

the `verify` boolean will tell the functions if you want waxjs to do the verification.

If `verify` is `true` then the waxjs library will do the verification and the functions will return a boolean either true of false to indicate if the verfication process succeeded.

If `verify` is `false` the library will then return the following verification object

```
{
    "type": "VERIFY",
    "accountName": "myacc.wam",
    "referer": "https://mywebsite.com/",
    "signature": "SIG_K1_Jx8kAWjeiyaQPZyDExo5xrMPWLeM93BzJ25w2m2tvMdTnYb8AQ9TPyaPKh9Lqygg4Q6BNfTTsk6chdrnuPyLqG85gjXBpX",
    "message": "cloudwallet-verification-https://mywebsite.com/-nonce-myacc.wam"
}
```
you can then use this structure if you want to do this verification in the backend.

`signature` is the signature that was signed using the private key. `accountName` is the account name we have on our record. the `message` is the message that was actually signed.

**The message is different for both the functions. the `userAccountVerify` will sign whatever nonce you send so the message will contain only the nonce, where as `waxProof` will contain a combined message as shown above.**

### Usage

```
wax.waxProof("hello world",true)
```

```
wax.userAccountProof("hello world","",true);
```

### Manual verification of signature.
```
import * as ecc from 'eosjs-ecc';
let verifyObj = await wax.waxProof("hello world",false);
let proofWaxActivePublicKey="EOS5fiahVT7rWcu2V18T93WoCcJ27HF4GR7xr9sX4SQ5rMbGvEH1Y"; //active key for proof.wax
const isValidSignature = ecc.verify(verifyObj.signature, verifyObj.message, proofWaxActivePublicKey);
if (isValidSignature) {
  alert('User authenticated');
} else {
  alert('User unauthenticated');
}

```

```
import * as ecc from 'eosjs-ecc';
let verifyObj = wax.userAccountProof("hello world","",false);
let userWaxActivePublicKey="EOS5aaaaaaaaaaaaa";
const isValidSignature = ecc.verify(verifyObj.signature, verifyObj.message, userWaxActivePublicKey);
if (isValidSignature) {
  alert('User authenticated');
} else {
  alert('User unauthenticated');
}
```

## Fee fallback

So long as waxjs is initialized with ```feeFallback = true``` (this is the default), Wallet automatically add action to transfer WAXP as fee for that transaction if user has enough balance. Transaction fee is calculated by formula:

```
waxFee = cpu_usage_us*CPU_FEE_RATIO + net_usage_words*NET_FEE_RATIO + FEE_CONSTANT;
```

By default CPU_FEE_RATIO=NET_FEE_RATIO=0.001, FEE_CONSTANT=0.01;

## Avatar
After logging in, you can get avatar of the current user by method
```js
wax.avatar;
```
If user sets the avatar using NFT, function will return IPFS hash. You can get full avatar URL from IPFS hash with a IPFS gateway, for example
```
https://ipfs.io/ipfs/<IPFS_HASH>
```

## Trust Score
Similar to Avatar above, you can get a user's trust score using the function
```js
wax.trustScore;
```
The Trust score will be from 0 to 1. If there is no score yet, the function will return the empty string `""`. 

TRUST scores are powered by [**Chain Champs**](https://www.chainchamps.com/blog/introducing-trust) and you can [learn more about TRUST here](https://trust.chainchamps.com/).

### The Trust score provider can be found in
```
wax.trustScoreProvider;
```

## Version
Current version of waxjs could be retrieved using
```js
wax.version;
```

## Switch Chain
Functionality to let DApp switch to a specifc chain after waxjs already mounted, so client side and flexible on chain actions.
### Usage
Get list of available chains
```
wax.getAvailableChains();
```
Switch to specific chain by chain name
```
wax.getChainInfoByChainName('chainname'); 
// if input param is null, then waxjs will switch back to original chain when it construct earlier
```

## Development

### Generate docs

``` npm run docs```

### Run the demo

``` npm run serve```

### Run tests

Note - run the demo app first (as above), and then run the tests suite:

``` npm run test```

### Build lib

``` npm run build```

### Build for web

``` npm run build-web```

## Contributing

When making a pull request, please make sure to run `npm run prettier` to make sure your code is as formatted as possible. Also, make sure `npm run lint` runs without errors, since that is the final check before a new version is published to npm.
