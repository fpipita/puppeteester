import { EventEmitter } from "events";
import { fileURLToPath } from "url";
import express from "express";
import glob from "glob";
import chokidar from "chokidar";
import esm from "@fpipita/esm-middleware";
import path from "path";
import { Scheduler } from "./scheduler.js";
import { DefaultTimer } from "./timer.js";
import { RunPuppeteerTask } from "./run-puppeteer-task.js";

/**
 * @typedef {Object} PuppeteesterConfig puppeteester configuration object.
 * @property {string} sources
 * @property {string} node-modules
 * @property {string} specs-glob
 * @property {"tdd" | "bdd" | "qunit"} ui
 * @property {boolean} disable-caching
 * @property {boolean} coverage
 * @property {string} coverage-output
 * @property {string[]} coverage-reporter
 * @property {number} chrome-default-viewport-width
 * @property {number} chrome-default-viewport-height
 * @property {number} chrome-remote-debugging-port
 * @property {string} chrome-remote-debugging-address
 * @property {string} chrome-executable-path
 * @property {number | null} express-port
 */

/**
 * @param {PuppeteesterConfig} config
 * @returns {express.Handler}
 */
const serveTests = config => (req, res) => {
  const useragent = req.headers["user-agent"];
  const headless = !useragent || /headless/i.test(useragent);
  glob(path.join(config.sources, config["specs-glob"]), (er, files) => {
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
          <link rel="stylesheet" href="/node_modules/mocha/mocha.css" />
          <title>Puppeteester</title>
          <script type="module">
            window.__puppeteester__ = ${JSON.stringify({
              headless,
              ui: config.ui
            })};
            window.process = ${JSON.stringify({ env: { NODE_ENV: "test" } })};
          </script>
          <script type="module" src="/puppeteester/setup.js"></script>
          ${files
            .map(
              file =>
                `<script type="module" src="${file.replace(
                  config.sources,
                  ""
                )}"></script>`
            )
            .join("\n")}
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
    app.use("/coverage", express.static(config["coverage-output"]));
  }

  // handles source code and specs
  app.use(
    esm(config.sources, {
      nodeModulesRoot: config["node-modules"],
      disableCaching: config["disable-caching"]
    })
  );
  app.use("/", express.static(config.sources));
  app.use("/node_modules", express.static(config["node-modules"]));

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
      this.emit("taskcomplete", event);
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
   * @param {PuppeteesterConfig} config
   */
  constructor(config) {
    super();
    this._config = config;
  }

  /**
   * @returns {Promise<PuppeteesterApplication>}
   */
  _start() {
    return new Promise(resolve => {
      const app = createApp(this._config);
      const server = app.listen(this._config["express-port"], () => {
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
   * @returns {Promise<import("./run-puppeteer-task").RunPuppetesterTaskOutput>}
   */
  async ci() {
    const app = await this._start();
    app.task.on("console", this.emit.bind(this, "console"));
    try {
      return await app.task.run();
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
