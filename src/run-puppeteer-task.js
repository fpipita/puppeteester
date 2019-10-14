import puppeteer from "puppeteer";
import { Task } from "./scheduler.js";

export class RunPuppeteerTask extends Task {
  /**
   *
   * @param {!string} testPageUrl
   */
  constructor(testPageUrl) {
    super();
    /** @type {?puppeteer.Browser} */
    this._browser = null;
    /** @type {?puppeteer.Page} */
    this._page = null;
    this._testPageUrl = testPageUrl;
  }

  async run() {
    if (this._browser === null || !this._browser.isConnected()) {
      this._browser = await puppeteer.launch({
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage"
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
