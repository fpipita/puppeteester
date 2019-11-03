import os from "os";
import which from "which";

export function findChromeExecutablePath() {
  if (os.platform() === "win32") {
    return which.sync("chrome", { nothrow: true });
  }
  return which.sync("google-chrome", { nothrow: true });
}
