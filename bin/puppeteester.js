#!/bin/sh
":" //# http://sambal.org/2014/02/passing-options-node-shebang-line/; exec /usr/bin/env node --experimental-modules "$0" "$@"
import { fileURLToPath } from "url";
import { dirname } from "path";
import { spawnSync } from "child_process";
import which from "which";
import { config } from "../src/config.js";

const puppeteester = dirname(dirname(fileURLToPath(import.meta.url)));

const args = [
  "run",
  "--rm",
  "-v",
  `${puppeteester}:/puppeteester`,
  "--workdir",
  "/puppeteester",
  "-v",
  `${config.sources}:/src`,
  "-v",
  `${config.nodeModules}:/node_modules`
];

if (config.coverage) {
  args.push("-v", `${config.coverage}:/coverage`);
}

if (config.inspectBrk) {
  args.push("-p", `${config.inspectBrk}:9222`);
}

args.push(
  "fpipita/chrome",
  "node",
  "--experimental-modules",
  "./src/puppeteester.js",
  "--sources",
  "/src",
  "--node-modules",
  "/node_modules",
  "--mode",
  config.mode,
  "--ui",
  config.ui,
  "--specs-glob",
  config.specsGlob
);

if (config.coverage) {
  args.push("--coverage", "/coverage");
}

const docker = which.sync("docker");
const result = spawnSync(docker, args, { stdio: "inherit" });

if (result.status) {
  process.exit(result.status);
}
