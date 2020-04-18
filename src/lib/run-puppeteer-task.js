import puppeteer from "puppeteer-core";
import pti from "puppeteer-to-istanbul";
import NYC from "nyc";
import fs from "fs";
import path from "path";
import minimatch from "minimatch";
import { Task } from "./task.js";
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
   * @param {string} testPageUrl
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
   * @param {puppeteer.CoverageEntry[]} entries
   */
  _filterCoverageEntries(entries) {
    return entries.filter((entry) => {
      const { pathname } = new URL(entry.url);
      if (minimatch(pathname, this._config["specs-glob"])) {
        // esclude spec files
        return false;
      }
      if (pathname === "/") {
        // exclude anonymous script tags
        return false;
      }
      if (pathname.startsWith("/puppeteester")) {
        // exclude puppeteester client side code
        return false;
      }
      if (pathname.startsWith("/node_modules")) {
        /**
         * exclude client side node_modules code, esm-middleware will
         * mount it on /node_modules by default
         */
        return false;
      }
      return true;
    });
  }

  /**
   * @returns {Promise<RunPuppetesterTaskOutput>}
   */
  async run() {
    this._running = new Deferred();
    if (this._browser === null || !this._browser.isConnected()) {
      this._browser = await puppeteer.launch({
        defaultViewport: {
          height: this._config["chrome-default-viewport-height"],
          width: this._config["chrome-default-viewport-width"],
        },
        executablePath: this._config["chrome-executable-path"],
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          `--remote-debugging-port=${this._config["chrome-remote-debugging-port"]}`,
          `--remote-debugging-address=${this._config["chrome-remote-debugging-address"]}`,
        ],
      });
    }
    if (this._page === null || this._page.isClosed()) {
      const pages = await this._browser.pages();
      if (pages.length > 0) {
        this._page = pages[0];
      } else {
        this._page = await this._browser.newPage();
      }
      /**
       * we expose the window.__done__ callback on the page. This
       * callback is invoked by Mocha when the test run completes
       * and resolves the this._running's promise which makes
       * run() return and in turn allows the scheduler to resume.
       */
      this._page.exposeFunction("__done__", this._done);
      this._page.on("console", async (msg) => {
        const args = [];
        for (let x of msg.args()) {
          args.push(await x.jsonValue());
        }
        this.emit("console", { args });
      });
      this._page.on("error", (error) => {
        this.emit("console", { args: [error] });
      });
      this._page.on("pageerror", (error) => {
        this.emit("console", { args: [error] });
      });
    }
    if (this._config.coverage) {
      await this._page.coverage.startJSCoverage();
    }
    let coverage = null;
    await this._page.goto(this._testPageUrl);
    const failures = await this._running.promise;
    if (this._config.coverage) {
      coverage = this._filterCoverageEntries(
        await this._page.coverage.stopJSCoverage()
      );
      fs.rmdirSync(path.resolve(".nyc_output"), { recursive: true });
      fs.rmdirSync(path.resolve(this._config["coverage-output"]), {
        recursive: true,
      });
      pti.write(coverage);
      const nyc = new NYC({
        reportDir: this._config["coverage-output"],
        reporter: this._config["coverage-reporter"],
      });
      await nyc.report();
    }
    return new RunPuppetesterTaskOutput(failures, coverage);
  }

  async cancel() {
    if (this._browser) {
      await this._browser.close();
    }
  }
}
