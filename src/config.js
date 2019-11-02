import path from "path";
import yargs from "yargs";

const argv = yargs.env("PUPPETEESTER").options({
  mode: {
    alias: "m",
    type: "string",
    choices: ["ci", "watch"],
    default: "ci",
    desc: [
      "Select `ci` to run tests once and report an",
      "exit status of either 0 on succes or 1 on failure",
      "to the calling process. Select `watch` to schedule",
      "a new test run on each file change."
    ].join(" ")
  },
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
    alias: "w",
    type: "number",
    default: 800,
    desc: "Sets Chrome viewport's width in pixels."
  },
  height: {
    alias: "h",
    type: "number",
    default: 600,
    desc: "Sets Chrome viewport's height in pixels."
  },
  "specs-glob": {
    alias: "p",
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
    alias: "c",
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
  }
}).argv;

/** @type {import("./puppeteester").PuppeteesterConfig} */
const config = {
  ui: /** @type {import("mocha").Interface} */ (argv.ui),
  mode: /** @type {import("./puppeteester").PuppeteesterMode} */ (argv.mode),
  // @ts-ignore
  coverage: argv.coverage ? path.resolve(argv.coverage) : null,
  browserOptions: {
    defaultViewport: {
      height: argv.height,
      width: argv.width
    }
  },
  nodeModules: path.resolve(argv["node-modules"]),
  sources: path.resolve(argv.sources),
  specsGlob: argv["specs-glob"],
  inspectBrk: argv["inspect-brk"]
};

export { config };
