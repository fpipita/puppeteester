import express from "express";
import glob from "glob";
import chokidar from "chokidar";
import esm from "@fpipita/esm-middleware";
import path from "path";
import { Scheduler } from "./scheduler.js";
import { RunPuppeteerTask } from "./run-puppeteer-task.js";

const EXPRESS_PORT = 3000;

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
          <script src="/puppeteester/node_modules/mocha/mocha.js?nomodule=true"></script>
          <script type="module">
            const config = { ui: "bdd" };
            if (${JSON.stringify(headless)}) {
              config.reporter = "spec";
            }
            mocha.setup(config);
            mocha.useColors(true);
            window.process = ${JSON.stringify({
              env: {
                NODE_ENV: "test"
              }
            })};
          </script>
          ${files.map(file => `<script type="module" src="${file}"></script>`)}
          <script type="module">
            before(() => {
              document.querySelector("#mocha").setAttribute("done", "false");
            });
            after(() => {
              document.querySelector("#mocha").setAttribute("done", "true");
            });
            mocha.checkLeaks();
            mocha.run();
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

  // main endpoint
  app.get("*", serveTests);

  // tests are run as soon as the Express app is up
  app.listen(EXPRESS_PORT, async () => {
    const task = new RunPuppeteerTask(`http://localhost:${EXPRESS_PORT}`);
    const scheduler = new Scheduler();
    /**
     * any time something changes in the client side source dir,
     * we schedule a test run
     */
    chokidar.watch("/src").on("all", () => {
      scheduler.schedule(task);
    });
  });
}

main();
