import { parse } from "./configuration.js";

export type PuppeteesterConfig = ReturnType<typeof parse> & {
  "specs-glob"?: string;
};

export interface IPuppeteesterConfig {
  sources: string;
  "node-modules": string;
  "specs-glob": string;
  ui: "tdd" | "bdd" | "qunit";
  "disable-caching": boolean;
  coverage: boolean;
  "coverage-output": string;
  "coverage-reporter": string[];
  "chrome-default-viewport-width": number;
  "chrome-default-viewport-height": number;
  "chrome-remote-debugging-port": number;
  "chrome-remote-debugging-address": string;
  "chrome-executable-path": string;
  "express-port": number | null;
}

export type TaskCompleteCallback<T> = (result: T) => any;

declare module "mocha" {
  export interface MochaOptions {
      checkLeaks?: boolean;
  }
}
