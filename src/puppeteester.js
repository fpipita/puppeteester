import { spawnSync } from "child_process";
import { URL } from "url";
import fse from "fs-extra";
import express from "express";
import glob from "glob";
import chokidar from "chokidar";
import esm from "@fpipita/esm-middleware";
import path from "path";
import pti from "puppeteer-to-istanbul";
import minimatch from "minimatch";
import { config } from "./config.js";
import { Scheduler } from "./scheduler.js";
import { DefaultTimer } from "./timer.js";
import { RunPuppeteerTask } from "./run-puppeteer-task.js";

/**
 * @typedef {"watch" | "ci"} PuppeteesterMode
 */

/**
 * Represent the publicly available options
 *
 * @typedef {Object} PuppeteesterConfig
 * @property {string} sources
 * @property {string} nodeModules
 * @property {string} specsGlob
 * @property {import("mocha").Interface} ui
 * @property {PuppeteesterMode} mode
 * @property {string | null} coverage,
 * @property {import("puppeteer-core").BrowserOptions} browserOptions
 * @property {string | null} inspectBrk
 */

/**
 * local constants
 */
const EXPRESS_PORT = 3000;

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
function serveTests(req, res) {
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
          <title>Condomani - testing</title>
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
}

/**
 * @type {import("./scheduler.js").TaskCompleteCallback<import("./run-puppeteer-task.js").RunPuppetesterTaskOutput>}
 */
function writeCoverage(result) {
  if (!result.coverage) {
    return;
  }
  if (!config.coverage || !path.isAbsolute(config.coverage)) {
    throw new TypeError("--coverage: absolute path expected");
  }
  const sourceFileEntries = result.coverage.filter(entry => {
    const url = new URL(entry.url);
    if (minimatch(config.specsGlob, url.pathname) || url.pathname === "/") {
      return false;
    }
    return !/^\/(node_modules|puppeteester|client)/.test(url.pathname);
  });
  pti.write(sourceFileEntries);
  spawnSync(
    path.resolve("node_modules", ".bin", "nyc"),
    ["report", "--reporter=html", "--reporter=text-summary"],
    {
      stdio: "inherit"
    }
  );
  fse.copySync(path.resolve("coverage"), config.coverage);
  fse.removeSync(path.resolve(".nyc_output"));
  fse.removeSync(path.resolve("coverage"));
}

const app = express();

// puppeteester client side scripts
app.use("/puppeteester", express.static(path.join("src", "client")));

// also make it easy to inspect the html coverage report
if (config.coverage) {
  app.use("/coverage", express.static(config.coverage));
}

// handles source code and specs
app.use(esm(config.sources, { nodeModulesRoot: config.nodeModules }));

// main endpoint
app.get("*", serveTests);

// tests are run as soon as the Express app is up
const server = app.listen(EXPRESS_PORT, async () => {
  const task = new RunPuppeteerTask(
    `http://localhost:${EXPRESS_PORT}/`,
    config.browserOptions,
    Boolean(config.coverage)
  );

  if (config.mode === "ci") {
    const result = await task.run();
    writeCoverage(result);
    server.close();
    process.exit(result.failures > 0 ? 1 : 0);
  } else {
    /** @type {Scheduler<import("./run-puppeteer-task.js").RunPuppetesterTaskOutput>} */
    const scheduler = new Scheduler(new DefaultTimer());
    scheduler.start(writeCoverage);
    chokidar.watch(config.sources).on("all", () => {
      scheduler.schedule(task);
    });
  }
});
