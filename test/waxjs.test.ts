const puppeteer = require("puppeteer");
const expect = require("expect-puppeteer");
const { expect: chaiExpect } = require("chai");

const { USERNAME, PASSWORD, WAMACCOUNT } = process.env;

if (!USERNAME) {
  console.error("USERNAME to login with required");
  process.exit(-1);
}

if (!PASSWORD) {
  console.error("PASSWORD to login with required");
  process.exit(-1);
}

if (!WAMACCOUNT) {
  console.error("WAMACCOUNT to sign into required");
  process.exit(-1);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe("waxjs", function() {
  this.timeout(120000); // mocha timeouts can interfere with expect-puppeteer's timeout
  expect.setDefaultOptions({ timeout: 10000 });

  it("signs and submits a transaction when authorized through a window", async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto("http://localhost:5000");
    chaiExpect(await page.title()).to.equal("waxjs demo");

    const [approveWindow] = <any>(
      await Promise.all([
        new Promise(resolve => page.once("popup", resolve)),
        page.click("#login")
      ])
    );

    const signIn = <any>(
      await new Promise(resolve => approveWindow.once("popup", resolve))
    );

    await expect(signIn).toFill('input[name="userName"]', USERNAME);
    await expect(signIn).toFill('input[name="password"]', PASSWORD);
    await expect(signIn).toClick("button", { text: "Login" });
    await sleep(2000);
    await expect(approveWindow).toClick("button", { text: "Approve" });

    await page.click("#sign");
    await sleep(2000);
    await expect(approveWindow).toClick("button", { text: "Approve" });

    await sleep(2000);
    await browser.close();
  });
});
