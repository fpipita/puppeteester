import assert from "assert";
import path from "path";

export class PuppeteesterConfigBuilder {
  constructor() {
    /** @type {import("./puppeteester").PuppeteesterConfig} */
    this._config = {
      coverage: null,
      browserOptions: {},
      inspectBrk: null,
      nodeModules: "",
      sources: "",
      ui: "tdd",
      specsGlob: "**/*.spec.js"
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

  /**
   * @param {string | null} inspectBrk
   */
  inspectBrk(inspectBrk) {
    this._config.inspectBrk = inspectBrk;
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
    return this._config;
  }
}
