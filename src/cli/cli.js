import path from "path";
import yargs from "yargs";
import { Puppeteester, PuppeteesterConfigBuilder } from "../lib/index.js";
import { findChromeExecutablePath } from "../lib/utils.js";

const argv = yargs
  .env("PUPPETEESTER")
  .command("$0 <mode> [specs-glob]", "starts puppeteester", yargs => {
    yargs
      .positional("mode", {
        desc: "define puppeteester's run mode",
        type: "string",
        choices: ["ci", "watch"]
      })
      .positional("specs-glob", {
        type: "string",
        default: "**/*.test.js",
        desc: [
          "Glob pattern to filter your spec files. This will be",
          "joined with the value provided in --sources. Make sure the",
          "pattern is enclosed within quotes to prevent the shell from",
          "expanding special chars (e.g. *)."
        ].join(" ")
      });
  })
  .options({
    ui: {
      choices: ["bdd", "tdd", "qunit"],
      type: "string",
      default: "tdd",
      desc: [
        "Sets the Mocha's interface that will be made available ",
        "to your test files."
      ].join(" ")
    },
    width: {
      type: "number",
      default: 800,
      desc: "Sets Chrome viewport's width in pixels."
    },
    height: {
      type: "number",
      default: 600,
      desc: "Sets Chrome viewport's height in pixels."
    },
    sources: {
      type: "string",
      demandOption: true,
      desc: "Absolute path to your app's source code and specs."
    },
    "disable-caching": {
      type: "boolean",
      default: false,
      desc: "If set to false, modules won't be cached."
    },
    "node-modules": {
      type: "string",
      demandOption: true,
      desc: "Absolute path to your app's node_modules folder."
    },
    coverage: {
      type: "string",
      default: null,
      desc: [
        "If set, it has to be an absolute path where puppeteester will",
        "output a code coverage report of your source code"
      ].join(" ")
    },
    "chrome-remote-debugging-address": {
      type: "string",
      default: "0.0.0.0",
      desc: "Chrome remote debugging address."
    },
    "chrome-remote-debugging-port": {
      type: "number",
      default: 9222,
      desc: "Chrome remote debugging port."
    },
    "chrome-executable-path": {
      type: "string",
      default: findChromeExecutablePath(),
      desc: "Absolute path to the Chrome executable."
    },
    "express-port": {
      type: "number",
      default: null,
      desc: "The port the Express server will be listening on."
    }
  }).argv;

(async function() {
  const configBuilder = new PuppeteesterConfigBuilder()
    .coverage(argv.coverage)
    .browserOptions({
      defaultViewport: {
        height: argv.height,
        width: argv.width
      }
    })
    .nodeModules(path.resolve(argv["node-modules"]))
    .sources(path.resolve(argv.sources))
    .disableCaching(argv["disable-caching"])
    .specsGlob(/** @type {string} */ (argv["specs-glob"]))
    .ui(/** @type {import("mocha").Interface} */ (argv.ui))
    .chromeExecutablePath(argv["chrome-executable-path"])
    .chromeRemoteDebuggingAddress(argv["chrome-remote-debugging-address"])
    .chromeRemoteDebuggingPort(argv["chrome-remote-debugging-port"])
    .expressPort(argv["express-port"]);
  const puppeteester = new Puppeteester(configBuilder);
  puppeteester.on("console", event => {
    console.log(...event.args);
  });
  if (argv.mode === "ci") {
    const result = await puppeteester.ci();
    process.exit(result.failures > 0 ? 1 : 0);
  } else {
    const watcher = await puppeteester.watch();
    watcher.on("taskcomplete", event => {
      console.log(event);
    });
  }
})();
