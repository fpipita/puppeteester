import { spawnSync } from "child_process";
import fse from "fs-extra";
import express from "express";
import glob from "glob";
import chokidar from "chokidar";
import esm from "@fpipita/esm-middleware";
import path from "path";
import pti from "puppeteer-to-istanbul";
import { Scheduler } from "./scheduler.js";
import { DefaultTimer } from "./timer.js";
import { RunPuppeteerTask } from "./run-puppeteer-task.js";
import { URL } from "url";

/**
 * @enum {string}
 */
const PuppeteesterMode = {
  watch: "watch",
  ci: "ci"
};

/**
 * Represent the publicly available options
 *
 * @typedef {Object} PuppeteesterConfig
 * @property {import("mocha").Interface} ui
 * @property {string} mode
 * @property {boolean} coverage,
 * @property {import("puppeteer-core").BrowserOptions} browserOptions
 */

/** @type {PuppeteesterConfig} */
const config = {
  ui: /** @type {import("mocha").Interface} */ (process.env.UI || "tdd"),
  mode: process.env.MODE || PuppeteesterMode.watch,
  coverage: JSON.parse(process.env.COVERAGE || "false"),
  browserOptions: JSON.parse(process.env.BROWSER_OPTIONS || "{}")
};

/**
 * local constants
 */
const EXPRESS_PORT = 3000;
const SPEC_FILES_GLOB = "/src/**/*.spec.js";

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
function serveTests(req, res) {
  const useragent = req.headers["user-agent"];
  const headless = !useragent || /headless/i.test(useragent);
  glob(SPEC_FILES_GLOB, (er, files) => {
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
          <link
            rel="stylesheet"
            href="/puppeteester/node_modules/mocha/mocha.css"
          />
          <title>Condomani - testing</title>
          <script type="module">
            window.__puppeteester__ = ${JSON.stringify({
              headless,
              ui: config.ui
            })};
            window.process = ${JSON.stringify({ env: { NODE_ENV: "test" } })};
          </script>
          <script type="module" src="/client/setup.js"></script>
          ${files.map(file => `<script type="module" src="${file}"></script>`)}
          <script type="module">
            mocha.checkLeaks();
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
  if (result.coverage === null) {
    return;
  }
  const sourceFileEntries = result.coverage.filter(entry => {
    const url = new URL(entry.url);
    if (url.pathname.endsWith(".spec.js") || url.pathname === "/") {
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
  fse.copySync(path.resolve("coverage"), "/coverage");
  fse.removeSync(path.resolve(".nyc_output"));
  fse.removeSync(path.resolve("coverage"));
}

function main() {
  const app = express();

  app.use(esm("/src", { nodeModulesRoot: "/node_modules" }));

  // client-side node_modules
  app.use("/node_modules", express.static("/node_modules"));

  // client-side source code
  app.use("/src", express.static("/src"));

  // puppeteester local node_modules (mostly used to serve Mocha)
  app.use(
    "/puppeteester/node_modules",
    express.static(path.resolve("node_modules"))
  );

  // puppeteester client side scripts
  app.use("/client", express.static(path.join("src", "client")));

  // also make it easy to inspect the html coverage report
  app.use("/coverage", express.static("/coverage"));

  // main endpoint
  app.get("*", serveTests);

  // tests are run as soon as the Express app is up
  const server = app.listen(EXPRESS_PORT, async () => {
    const task = new RunPuppeteerTask(
      `http://localhost:${EXPRESS_PORT}/`,
      config.browserOptions,
      config.coverage
    );

    if (config.mode === PuppeteesterMode.ci) {
      const result = await task.run();
      writeCoverage(result);
      server.close();
      process.exit(result.failures > 0 ? 1 : 0);
    } else {
      /** @type {Scheduler<import("./run-puppeteer-task.js").RunPuppetesterTaskOutput>} */
      const scheduler = new Scheduler(new DefaultTimer());
      scheduler.start(writeCoverage);
      chokidar.watch("/src").on("all", () => {
        scheduler.schedule(task);
      });
    }
  });
}

main();
