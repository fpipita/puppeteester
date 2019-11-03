import path from "path";
import yargs from "yargs";
import { Puppeteester, PuppeteesterConfigBuilder } from "../lib/index.js";
import { findChromeExecutablePath } from "../lib/utils.js";

const argv = yargs
  .env("PUPPETEESTER")
  .command("$0 <mode>", "starts puppeteester", yargs => {
    yargs.positional("mode", {
      desc: "define puppeteester's the run mode",
      type: "string",
      choices: ["ci", "watch"]
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
    "specs-glob": {
      type: "string",
      default: "**/*.spec.js",
      desc: [
        "Glob pattern to filter your spec files. This will be",
        "joined with the value provided in --sources."
      ].join(" ")
    },
    sources: {
      type: "string",
      demandOption: true,
      desc: "Absolute path to your app's source code and specs."
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
    "inspect-brk": {
      type: "string",
      default: null,
      desc: [
        "It takes a host and port in the format host:port (same as the node",
        "--inspect-brk switch). If set, debugging clients will be able to",
        "connect to the given address."
      ].join(" ")
    },
    "chrome-executable-path": {
      type: "string",
      default: findChromeExecutablePath(),
      desc: "Absolute path to the Chrome executable."
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
    .inspectBrk(argv["inspect-brk"])
    .nodeModules(path.resolve(argv["node-modules"]))
    .sources(path.resolve(argv.sources))
    .specsGlob(argv["specs-glob"])
    .ui(/** @type {import("mocha").Interface} */ (argv.ui))
    .chromeExecutablePath(argv["chrome-executable-path"]);
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