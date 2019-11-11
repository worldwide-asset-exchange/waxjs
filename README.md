# waxjs

Javascript API for integration with the WAX Cloud Wallet.

## Installation

### Browser

Grab the waxjs.js minified bundle in the dist-web folder of this repo, or build it yourself (see below). [Check the example code](https://github.com/worldwide-asset-exchange/waxjs/blob/develop/dist-web/index.html) to see how to use it.

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

Instantiate the waxjs object with the RPC server you wish to connect to.

```js
const wax = new waxjs.WaxJS('https://wax.greymass.com');
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

## Development

### Generate docs

``` npm run docs```

### Run tests

``` npm run test```

### Build lib

``` npm run build```

### Build for web 

``` npm run build-web```
