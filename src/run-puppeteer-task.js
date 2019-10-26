import puppeteer from "puppeteer-core";
import { Task } from "./scheduler.js";
import { Deferred } from "./deferred.js";

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
    this._done = this._done.bind(this);
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
    /** @type {Deferred<number>} */
    this._running = new Deferred();
  }

  /**
   * @param {number} failures number of failed tests
   * @see {@link https://mochajs.org/api/runner#run}
   */
  _done(failures) {
    this._running.resolve(failures);
  }

  /**
   * @returns {Promise<number>}
   */
  async run() {
    this._running = new Deferred();
    if (this._browser === null || !this._browser.isConnected()) {
      this._browser = await puppeteer.launch({
        ...this._browserOptions,
        executablePath: "/usr/bin/google-chrome",
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
      /**
       * we expose the window.__done__ callback on the page. This
       * callback is invoked by Mocha when the test run completes
       * and resolves the this._running's promise which makes
       * run() return and in turn allows the scheduler to resume.
       */
      this._page.exposeFunction("__done__", this._done);
      this._page.on("console", async msg => {
        const args = [];
        for (let x of msg.args()) {
          args.push(await x.jsonValue());
        }
        console.log(...args);
      });
      this._page.on("error", error => {
        console.error(error);
      });
      this._page.on("pageerror", error => {
        /**
         * uncaught errors (the ones that get printed to the
         * browser console, e.g. a reference error)
         */
        console.error(error);
      });
      await this._page.goto(this._testPageUrl);
    }
    return this._running.promise;
  }
}
