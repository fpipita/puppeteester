import express from "express";
import glob from "glob";
import chokidar from "chokidar";
import esm from "@fpipita/esm-middleware";
import path from "path";
import { Scheduler, DefaultTimer } from "./scheduler.js";
import { RunPuppeteerTask } from "./run-puppeteer-task.js";

/**
 * @enum {string}
 */
const PuppeteesterMode = {
  watch: "watch",
  ci: "ci"
};

const EXPRESS_PORT = 3000;
const MOCHA_UI = process.env.MOCHA_UI || "tdd";
const PUPPETEER_BROWSER_OPTIONS = JSON.parse(
  process.env.PUPPETEER_BROWSER_OPTIONS || "{}"
);

const PUPPETEESTER_MODE =
  process.env.PUPPETEESTER_MODE || PuppeteesterMode.watch;

/**
 *
 * @param {express.Request} req
 * @param {express.Response} res
 */
function serveTests(req, res) {
  const useragent = req.headers["user-agent"];
  const headless = !useragent || /headless/i.test(useragent);
  glob("/src/**/*.spec.js", (er, files) => {
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
              ui: MOCHA_UI
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

function main() {
  const app = express();

  app.use(esm({ cache: false, nodeModulesRoot: "/node_modules" }));

  // client-side node_modules
  app.use("/node_modules", express.static("/node_modules"));

  // client-side source code
  app.use("/src", express.static("/src"));

  // puppeteester local node_modules
  app.use(
    "/puppeteester/node_modules",
    express.static(path.resolve("node_modules"))
  );

  // puppeteester client side scripts
  app.use("/client", express.static(path.join("src", "client")));

  // main endpoint
  app.get("*", serveTests);

  // tests are run as soon as the Express app is up
  const server = app.listen(EXPRESS_PORT, async () => {
    const task = new RunPuppeteerTask(
      `http://localhost:${EXPRESS_PORT}`,
      PUPPETEER_BROWSER_OPTIONS
    );

    if (PUPPETEESTER_MODE === PuppeteesterMode.ci) {
      const failures = await task.run();
      server.close();
      process.exit(failures > 0 ? 1 : 0);
    } else {
      /**
       * any time something changes in the client side source dir,
       * we schedule a test run
       */
      const scheduler = new Scheduler(new DefaultTimer());
      scheduler.start();
      chokidar.watch("/src").on("all", () => {
        scheduler.schedule(task);
      });
    }
  });
}

main();
