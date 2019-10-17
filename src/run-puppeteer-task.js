import puppeteer from "puppeteer";
import { Task } from "./scheduler.js";

const BROWSER_OPTIONS_KEYS = new Set([
  "ignoreHTTPSErrors",
  "defaultViewport",
  "slowMo"
]);

export class RunPuppeteerTask extends Task {
  /**
   *
   * @param {!string} testPageUrl
   * @param {puppeteer.BrowserOptions=} browserOptions
   */
  constructor(testPageUrl, browserOptions) {
    super();
    /** @type {?puppeteer.Browser} */
    this._browser = null;
    /** @type {?puppeteer.Page} */
    this._page = null;
    this._testPageUrl = testPageUrl;
    /** @type {puppeteer.BrowserOptions} */
    this._browserOptions = Object.fromEntries(
      Object.entries(browserOptions || {}).filter(([k]) =>
        BROWSER_OPTIONS_KEYS.has(k)
      )
    );
  }

  async run() {
    if (this._browser === null || !this._browser.isConnected()) {
      this._browser = await puppeteer.launch({
        ...this._browserOptions,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--remote-debugging-port=9222",
          "--remote-debugging-address=0.0.0.0"
        ]
      });
    }
    if (this._page !== null && !this._page.isClosed()) {
      await this._page.reload();
    } else {
      this._page = await this._browser.newPage();
      this._page.on("console", async msg => {
        const args = [];
        for (let x of msg.args()) {
          args.push(await x.jsonValue());
        }
        console.log(...args);
      });
      await this._page.goto(this._testPageUrl);
    }
    try {
      await this._page.waitForSelector("#mocha[done=true]");
    } catch (ex) {
      console.error("Error while running tests in Chrome", ex);
    }
  }
}
