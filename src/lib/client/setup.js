import "/node_modules/mocha/mocha.js?nomodule=true";
import { headless, ui } from "./config.js";

mocha.setup({
  timeout: 0,
  ui,
  color: true,
  reporter: headless ? "spec" : undefined,
  checkLeaks: false,
});
