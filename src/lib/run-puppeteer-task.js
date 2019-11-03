import puppeteer from "puppeteer-core";
import { Task } from "./scheduler.js";
import { Deferred } from "./deferred.js";

export class RunPuppetesterTaskOutput {
  /**
   * @param {number} failures number of failed tests.
   * @param {puppeteer.CoverageEntry[] | null} coverage
   */
  constructor(failures, coverage) {
    this.failures = failures;
    this.coverage = coverage;
  }
}

export class RunPuppeteerTask extends Task {
  /**
   *
   * @param {!string} testPageUrl
   * @param {import("./puppeteester.js").PuppeteesterConfig} config
   */
  constructor(testPageUrl, config) {
    super();
    this._done = this._done.bind(this);
    /** @type {import("./puppeteester.js").PuppeteesterConfig} */
    this._config = config;
    /** @type {?puppeteer.Browser} */
    this._browser = null;
    /** @type {?puppeteer.Page} */
    this._page = null;
    this._testPageUrl = testPageUrl;
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
   * @returns {Promise<RunPuppetesterTaskOutput>}
   */
  async run() {
    this._running = new Deferred();
    if (this._browser === null || !this._browser.isConnected()) {
      this._browser = await puppeteer.launch({
        ...this._config.browserOptions,
        executablePath: this._config.chromeExecutablePath,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--remote-debugging-port=9222",
          "--remote-debugging-address=0.0.0.0"
        ]
      });
    }
    if (this._page === null || this._page.isClosed()) {
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
        this.emit("console", { args });
      });
      this._page.on("error", this.emit.bind(this, "console"));
      this._page.on("pageerror", this.emit.bind(this, "console"));
    }
    if (this._config.coverage) {
      await this._page.coverage.startJSCoverage();
    }
    let coverage = null;
    await this._page.goto(this._testPageUrl);
    const failures = await this._running.promise;
    if (this._config.coverage) {
      coverage = await this._page.coverage.stopJSCoverage();
    }
    await this._page.close();
    return new RunPuppetesterTaskOutput(failures, coverage);
  }

  async cancel() {
    if (this._browser) {
      await this._browser.close();
    }
  }
}
