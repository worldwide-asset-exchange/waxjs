const { expect } = require("chai");
const { defaultTxVerifier } = require("../src");

describe("test default tx verifier", function() {
  it("Should allow if augmentedTx and originalTx is the same", async () => {
    const user = {
      account: "user1.wam",
      keys: []
    };
    const tx = {
      actions: [
        {
          account: "eosio.token",
          name: "transfer",
          authorization: [
            {
              actor: user.account,
              permission: "active"
            }
          ],
          data: {
            from: user.account,
            to: "user2.wam",
            quantity: "1.00000000 WAX",
            memo: "test"
          }
        }
      ]
    };
    await expect(function() {
      defaultTxVerifier(user, tx, tx);
    }).not.to.throw();
  });

  it("Should not allow if augmentedTx add action in the end", async () => {
    const user = {
      account: "user1.wam",
      keys: []
    };
    const originalTx = {
      actions: [
        {
          account: "eosio.token",
          name: "transfer",
          authorization: [
            {
              actor: user.account,
              permission: "active"
            }
          ],
          data: {
            from: user.account,
            to: "user2.wam",
            quantity: "1.00000000 WAX",
            memo: "test"
          }
        }
      ]
    };

    const augmentedTx = {
      actions: [
        {
          account: "eosio.token",
          name: "transfer",
          authorization: [
            {
              actor: user.account,
              permission: "active"
            }
          ],
          data: {
            from: user.account,
            to: "user2.wam",
            quantity: "1.00000000 WAX",
            memo: "test"
          }
        },
        {
          account: "boost.wax",
          name: "noop",
          authorization: [
            {
              actor: "boost.wax",
              permission: "active"
            }
          ],
          data: {}
        }
      ]
    };
    await expect(function() {
      defaultTxVerifier(user, originalTx, augmentedTx);
    }).to.throw(
      "Augmented transaction actions has modified actions from the original.\nOriginal: "
    );
  });

  it("Should allow if augmentedTx buy missing ram for user", async () => {
    const user = {
      account: "user1.wam",
      keys: []
    };
    const originalTx = {
      actions: [
        {
          account: "eosio.token",
          name: "transfer",
          authorization: [
            {
              actor: user.account,
              permission: "active"
            }
          ],
          data: {
            from: user.account,
            to: "user2.wam",
            quantity: "1.00000000 WAX",
            memo: "test"
          }
        }
      ]
    };

    const augmentedTx = {
      actions: [
        {
          account: "eosio",
          name: "buyrambytes",
          authorization: [
            {
              actor: user.account,
              permission: "active"
            }
          ],
          data: {
            payer: user.account,
            receiver: user.account,
            bytes: 1
          }
        },
        {
          account: "eosio.token",
          name: "transfer",
          authorization: [
            {
              actor: user.account,
              permission: "active"
            }
          ],
          data: {
            from: user.account,
            to: "user2.wam",
            quantity: "1.00000000 WAX",
            memo: "test"
          }
        }
      ]
    };
    await expect(function() {
      defaultTxVerifier(user, originalTx, augmentedTx);
    }).not.to.throw();
  });

  it("Should not allow if augmentedTx buy ram for madiculos user", async () => {
    const user = {
      account: "user1.wam",
      keys: []
    };
    const originalTx = {
      actions: [
        {
          account: "eosio.token",
          name: "transfer",
          authorization: [
            {
              actor: user.account,
              permission: "active"
            }
          ],
          data: {
            from: user.account,
            to: "user2.wam",
            quantity: "1.00000000 WAX",
            memo: "test"
          }
        }
      ]
    };

    const augmentedTx = {
      actions: [
        {
          account: "eosio",
          name: "buyrambytes",
          authorization: [
            {
              actor: user.account,
              permission: "active"
            }
          ],
          data: {
            payer: user.account,
            receiver: "fake.wam",
            bytes: 1
          }
        },
        {
          account: "eosio.token",
          name: "transfer",
          authorization: [
            {
              actor: user.account,
              permission: "active"
            }
          ],
          data: {
            from: user.account,
            to: "user2.wam",
            quantity: "1.00000000 WAX",
            memo: "test"
          }
        }
      ]
    };
    await expect(function() {
      defaultTxVerifier(user, originalTx, augmentedTx);
    }).to.throw(
      "Augmented transaction actions has an extra action from the original authorizing the user.\nOriginal"
    );
  });

  it("Should allow if augmentedTx to pay bandwidth fee", async () => {
    const user = {
      account: "user1.wam",
      keys: []
    };
    const originalTx = {
      actions: [
        {
          account: "eosio.token",
          name: "transfer",
          authorization: [
            {
              actor: user.account,
              permission: "active"
            }
          ],
          data: {
            from: user.account,
            to: "user2.wam",
            quantity: "1.00000000 WAX",
            memo: "test"
          }
        }
      ]
    };

    const augmentedTx = {
      actions: [
        {
          account: "boost.wax",
          name: "noop",
          authorization: [
            {
              actor: "boost.wax",
              permission: "paybw"
            }
          ],
          data: {}
        },
        {
          account: "eosio.token",
          name: "transfer",
          authorization: [
            {
              actor: user.account,
              permission: "active"
            }
          ],
          data: {
            from: user.account,
            to: "gasfee.wax",
            quantity: "0.01000000 WAX",
            memo: "WAX fee for 10 us CPU and 10 words NET"
          }
        },
        {
          account: "eosio.token",
          name: "transfer",
          authorization: [
            {
              actor: user.account,
              permission: "active"
            }
          ],
          data: {
            from: user.account,
            to: "user2.wam",
            quantity: "1.00000000 WAX",
            memo: "test"
          }
        }
      ]
    };
    await expect(function() {
      defaultTxVerifier(user, originalTx, augmentedTx);
    }).not.to.throw();
  });

  it("Should not allow if augmentedTx charge WAX fee without pay bandwidth", async () => {
    const user = {
      account: "user1.wam",
      keys: []
    };
    const originalTx = {
      actions: [
        {
          account: "eosio.token",
          name: "transfer",
          authorization: [
            {
              actor: user.account,
              permission: "active"
            }
          ],
          data: {
            from: user.account,
            to: "user2.wam",
            quantity: "1.00000000 WAX",
            memo: "test"
          }
        }
      ]
    };

    const augmentedTx = {
      actions: [
        {
          account: "eosio.token",
          name: "transfer",
          authorization: [
            {
              actor: user.account,
              permission: "active"
            }
          ],
          data: {
            from: user.account,
            to: "boost.wax",
            quantity: "0.01000000 WAX",
            memo: "WAX fee for 10 us CPU and 10 words NET"
          }
        },
        {
          account: "eosio.token",
          name: "transfer",
          authorization: [
            {
              actor: user.account,
              permission: "active"
            }
          ],
          data: {
            from: user.account,
            to: "user2.wam",
            quantity: "1.00000000 WAX",
            memo: "test"
          }
        }
      ]
    };
    await expect(function() {
      defaultTxVerifier(user, originalTx, augmentedTx);
    }).to.throw(
      "Augmented transaction actions has an extra action from the original authorizing the user.\nOriginal"
    );
  });

  it("Should not allow if augmentedTx has an extra action from the original authorizing the user", async () => {
    const user = {
      account: "user1.wam",
      keys: []
    };
    const originalTx = {
      actions: [
        {
          account: "eosio.token",
          name: "transfer",
          authorization: [
            {
              actor: user.account,
              permission: "active"
            }
          ],
          data: {
            from: user.account,
            to: "user2.wam",
            quantity: "1.00000000 WAX",
            memo: "test"
          }
        }
      ]
    };

    const augmentedTx = {
      actions: [
        {
          account: "eosio.token",
          name: "transfer",
          authorization: [
            {
              actor: user.account,
              permission: "active"
            }
          ],
          data: {
            from: user.account,
            to: "fake.wam",
            quantity: "0.01000000 WAX",
            memo: "WAX fee for 10 us CPU and 10 words NET"
          }
        },
        {
          account: "eosio.token",
          name: "transfer",
          authorization: [
            {
              actor: user.account,
              permission: "active"
            }
          ],
          data: {
            from: user.account,
            to: "user2.wam",
            quantity: "1.00000000 WAX",
            memo: "test"
          }
        }
      ]
    };
    await expect(function() {
      defaultTxVerifier(user, originalTx, augmentedTx);
    }).to.throw(
      "Augmented transaction actions has an extra action from the original authorizing the user.\nOriginal"
    );
  });
});
