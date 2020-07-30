import path from "path";
import yargs from "yargs";
import { findChromeExecutablePath } from "./utils.js";

export const DEFAULT_GLOB_PATTERN = "**/*.test.js";

export const parse = yargs
  .env("PUPPETEESTER")
  .command("$0 <mode> [specs-glob]", "starts puppeteester", (yargs) => {
    yargs
      .positional("mode", {
        desc: "define puppeteester's run mode",
        type: "string",
        choices: ["ci", "watch"],
      })
      .positional("specs-glob", {
        type: "string",
        default: DEFAULT_GLOB_PATTERN,
        desc:
          "Glob pattern to filter the spec files. This will be joined with the value provided in --sources. Make sure the pattern is enclosed within quotes to prevent the shell from expanding special chars (e.g. *).",
      });
  })
  .option("ui", {
    choices: ["bdd", "tdd", "qunit"],
    type: "string",
    default: "tdd",
    desc: "Mocha interface to be exposed to test files.",
  })
  .option("sources", {
    type: "string",
    demandOption: true,
    desc: "Path to the project's source code.",
    coerce: (arg) => path.resolve(arg),
  })
  .option("node-modules", {
    type: "string",
    default: path.resolve("node_modules"),
    desc: "Path to the project's node_modules folder.",
    coerce: (arg) => path.resolve(arg),
  })
  .option("disable-caching", {
    type: "boolean",
    default: false,
    desc: "Enables or disables esm-middleware module caching.",
  })
  .option("coverage", {
    type: "boolean",
    default: false,
    desc: "Enables or disables code coverage report generation.",
  })
  .option("coverage-output", {
    type: "string",
    default: path.resolve("coverage"),
    desc: "Code coverage output directory.",
    coerce: (arg) => path.resolve(arg),
  })
  .option("coverage-reporter", {
    type: "string",
    default: ["text"],
    desc: "A valid Istanbul reporter name. Can be repeated multiple times.",
  })
  .option("chrome-default-viewport-width", {
    type: "number",
    default: 800,
    desc: "Chrome viewport's width in pixels.",
  })
  .option("chrome-default-viewport-height", {
    type: "number",
    default: 600,
    desc: "Chrome viewport's height in pixels.",
  })
  .option("chrome-remote-debugging-address", {
    type: "string",
    default: "0.0.0.0",
    desc: "Chrome remote debugging address.",
  })
  .option("chrome-remote-debugging-port", {
    type: "number",
    default: 9222,
    desc: "Chrome remote debugging port.",
  })
  .option("chrome-executable-path", {
    type: "string",
    default: findChromeExecutablePath() ?? undefined,
    desc: "Absolute path to the Chrome executable.",
  })
  .option("express-port", {
    type: "number",
    default: null,
    desc: "The port the Express server will be listening on.",
  }).parse;
