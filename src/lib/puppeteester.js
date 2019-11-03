import assert from "assert";
import { EventEmitter } from "events";
import { fileURLToPath } from "url";
import { URL } from "url";
import express from "express";
import glob from "glob";
import chokidar from "chokidar";
import esm from "@fpipita/esm-middleware";
import path from "path";
import minimatch from "minimatch";
import { Scheduler } from "./scheduler.js";
import { DefaultTimer } from "./timer.js";
import { RunPuppeteerTask } from "./run-puppeteer-task.js";
import { PuppeteesterConfigBuilder } from "./config-builder.js";

/**
 * @typedef {Object} PuppeteesterConfig puppeteester configuration object.
 * @property {string} sources absolute path to your app's source code and
 * specs folder.
 * @property {string} nodeModules absolute path to your app's `node_modules`
 * folder.
 * @property {string} specsGlob optional, glob pattern to filter your spec
 * files. This will be joined with the value provided in `sources`.
 * @property {import("mocha").Interface} ui sets the Mocha's interface that
 * will be made available to your test files.
 * @property {string | null} coverage if set, it has to be an absolute path
 * where puppeteester will output a code coverage report of your source code.
 * @property {import("puppeteer-core").BrowserOptions} browserOptions
 * @property {number} chromeRemoteDebuggingPort
 * @property {string} chromeRemoteDebuggingAddress
 * @property {string} chromeExecutablePath absolute path to the Chrome
 * executable.
 */

/**
 * @param {PuppeteesterConfig} config
 * @returns {express.Handler}
 */
const serveTests = config => (req, res) => {
  const useragent = req.headers["user-agent"];
  const headless = !useragent || /headless/i.test(useragent);
  glob(path.join(config.sources, config.specsGlob), (er, files) => {
    res.send(/* HTML */ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <meta http-equiv="X-UA-Compatible" content="ie=edge" />
          <link rel="stylesheet" href="/puppeteester/vendor/mocha.css" />
          <title>Puppeteester</title>
          <script type="module">
            window.__puppeteester__ = ${JSON.stringify({
              headless,
              ui: config.ui
            })};
            window.process = ${JSON.stringify({ env: { NODE_ENV: "test" } })};
          </script>
          <script type="module" src="/puppeteester/setup.js"></script>
          ${files.map(
            file =>
              `<script type="module" src="${file.replace(
                config.sources,
                ""
              )}"></script>`
          )}
          <script type="module">
            // the __done__ callback is exposed by the RunPuppeteerTask's
            // run() method
            mocha.run(window.__done__);
          </script>
        </head>
        <body>
          <div id="mocha"></div>
        </body>
      </html>
    `);
  });
};

/**
 * @param {PuppeteesterConfig} config
 * @returns {express.Application}
 */
function createApp(config) {
  const app = express();
  // puppeteester client side scripts
  app.use(
    "/puppeteester",
    express.static(
      path.join(path.dirname(fileURLToPath(import.meta.url)), "client")
    )
  );

  // also make it easy to inspect the html coverage report
  if (config.coverage) {
    app.use("/coverage", express.static(config.coverage));
  }

  // handles source code and specs
  app.use(esm(config.sources, { nodeModulesRoot: config.nodeModules }));

  // main endpoint
  app.get("*", serveTests(config));
  return app;
}

class PuppeteesterApplication {
  /**
   * @param {import("http").Server} server
   * @param {RunPuppeteerTask} task
   */
  constructor(server, task) {
    this.server = server;
    this.task = task;
  }
}

class PuppeteesterReport {
  /**
   * @param {import("./run-puppeteer-task.js").RunPuppetesterTaskOutput} result
   * @param {PuppeteesterConfig} config
   */
  constructor(result, config) {
    /** @type {number} */
    this.failures = result.failures;
    /** @type {import("puppeteer-core").CoverageEntry[]} */
    this.coverage = (result.coverage || []).filter(entry => {
      const { pathname } = new URL(entry.url);
      if (minimatch(pathname, config.specsGlob)) {
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
}

class PuppeteesterWatcher extends EventEmitter {
  /**
   * @param {PuppeteesterApplication} app
   * @param {PuppeteesterConfig} config
   */
  constructor(app, config) {
    super();
    /** @type {Scheduler<import("./run-puppeteer-task").RunPuppetesterTaskOutput>} */
    this._scheduler = new Scheduler(new DefaultTimer());
    this._scheduler.on("taskcomplete", (
      /** @type {import("./run-puppeteer-task").RunPuppetesterTaskOutput} */ event
    ) => {
      this.emit("taskcomplete", new PuppeteesterReport(event, config));
    });
    this._scheduler.start();
    this._watcher = chokidar.watch(config.sources);
    this._watcher.on("all", () => {
      this._scheduler.schedule(app.task);
    });
  }

  /**
   * @returns {Promise}
   */
  async close() {
    await this._watcher.close();
    await this._scheduler.shutdown();
  }
}

export class Puppeteester extends EventEmitter {
  /**
   * @param {PuppeteesterConfigBuilder} configBuilder
   */
  constructor(configBuilder) {
    super();
    assert.ok(
      configBuilder instanceof PuppeteesterConfigBuilder,
      "configBuilder: expected PuppeteesterConfigBuilder instance"
    );
    this._config = configBuilder.build();
  }

  /**
   * @returns {Promise<PuppeteesterApplication>}
   */
  _start() {
    return new Promise(resolve => {
      const app = createApp(this._config);
      const server = app.listen(() => {
        const address = /** @type {import("net").AddressInfo} */ (server.address());
        const task = new RunPuppeteerTask(
          `http://localhost:${address.port}`,
          this._config
        );
        resolve(new PuppeteesterApplication(server, task));
      });
    });
  }

  /**
   * @returns {Promise<PuppeteesterReport>}
   */
  async ci() {
    const app = await this._start();
    app.task.on("console", this.emit.bind(this, "console"));
    try {
      const result = await app.task.run();
      return new PuppeteesterReport(result, this._config);
    } finally {
      app.server.close();
      await app.task.cancel();
    }
  }

  /**
   * @returns {Promise<PuppeteesterWatcher>}
   */
  async watch() {
    const app = await this._start();
    app.task.on("console", this.emit.bind(this, "console"));
    return new PuppeteesterWatcher(app, this._config);
  }
}
