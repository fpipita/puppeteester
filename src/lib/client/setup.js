import "/node_modules/mocha/mocha.js?nomodule=true";
import { headless, ui } from "./config.js";

mocha.setup({
  enableTimeouts: false,
  ui,
  color: true,
  reporter: headless ? "spec" : undefined,
  checkLeaks: false,
});
