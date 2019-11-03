import assert from "assert";
import path from "path";
import { findChromeExecutablePath } from "./utils.js";

export class PuppeteesterConfigBuilder {
  constructor() {
    /** @type {import("./puppeteester").PuppeteesterConfig} */
    this._config = {
      coverage: null,
      browserOptions: {},
      chromeRemoteDebuggingAddress: "0.0.0.0",
      chromeRemoteDebuggingPort: 9222,
      nodeModules: "",
      sources: "",
      ui: "tdd",
      specsGlob: "**/*.spec.js",
      chromeExecutablePath: findChromeExecutablePath() || ""
    };
  }

  /**
   * @param {string | null} coverage
   */
  coverage(coverage) {
    this._config.coverage = coverage;
    return this;
  }

  /**
   * @param {import("puppeteer-core").BrowserOptions} browserOptions
   */
  browserOptions(browserOptions) {
    this._config.browserOptions = browserOptions;
    return this;
  }

  chromeRemoteDebuggingAddress(chromeRemoteDebuggingAddress) {
    this._config.chromeRemoteDebuggingAddress = chromeRemoteDebuggingAddress;
    return this;
  }

  chromeRemoteDebuggingPort(chromeRemoteDebuggingPort) {
    this._config.chromeRemoteDebuggingPort = chromeRemoteDebuggingPort;
    return this;
  }

  /**
   * @param {string} nodeModules
   */
  nodeModules(nodeModules) {
    this._config.nodeModules = nodeModules;
    return this;
  }

  /**
   * @param {string} sources
   */
  sources(sources) {
    this._config.sources = sources;
    return this;
  }

  /**
   * @param {import("mocha").Interface} ui
   */
  ui(ui) {
    this._config.ui = ui;
    return this;
  }

  /**
   * @param {string} specsGlob
   */
  specsGlob(specsGlob) {
    this._config.specsGlob = specsGlob;
    return this;
  }

  chromeExecutablePath(chromeExecutablePath) {
    this._config.chromeExecutablePath = chromeExecutablePath;
    return this;
  }

  /**
   * @returns {import("./puppeteester").PuppeteesterConfig}
   */
  build() {
    assert.ok(
      this._config.sources && path.isAbsolute(this._config.sources),
      `sources: expected absolute path, got: ${this._config.sources}`
    );
    assert.ok(
      this._config.nodeModules && path.isAbsolute(this._config.nodeModules),
      `nodeModules: expected absolute path, got: ${this._config.nodeModules}`
    );
    assert.ok(
      this._config.specsGlob,
      `specsGlob: expected glob pattern, got ${this._config.specsGlob}`
    );
    assert.ok(
      this._config.chromeExecutablePath &&
        path.isAbsolute(this._config.chromeExecutablePath),
      "chromeExecutablePath: missing or invalid path"
    );
    return this._config;
  }
}
