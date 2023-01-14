# waxjs

Javascript API for integration with the WAX Cloud Wallet.

## Documentation

[Check the WAX developer portal for full instructions](https://developer.wax.io/docs/wax-cloud-wallet/waxjs/)

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
import * as waxjs from "@waxio/waxjs";
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

## Free Bandwidth

So long as waxjs is initialized with ```freeBandwidth = true``` (this is the default), your dapp will take advantage of freebandwidth provided by WAX, up to 5ms of CPU and 5K words per user per 24 hours, and tentatively 50s per contract per 24 hrs.

Dapps that require more bandwidth will be able to register their own bandwidth via the [bandwidth registration contract](https://wax.bloks.io/account/boost.wax?loadContract=true&tab=Actions&account=boost.wax&scope=boost.wax&limit=100&action=reg). More info on registering for extra bandwidth management can be found [here](https://github.com/worldwide-asset-exchange/boost.wax).


## Fee fallback

So long as waxjs is initialized with ```feeFallback = true``` (this is the default), Wallet automatically add action to transfer WAXP as fee for that transaction if user has enough balance. Transaction fee is calculated by formula:

```
waxFee = cpu_usage_us*CPU_FEE_RATIO + net_usage_words*NET_FEE_RATIO + FEE_CONSTANT;
```

By default CPU_FEE_RATIO=NET_FEE_RATIO=0.001, FEE_CONSTANT=0.01;

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
