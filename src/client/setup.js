import "/puppeteester/vendor/mocha.js?nomodule=true";
import { headless, ui } from "./config.js";

mocha.setup({
  enableTimeouts: false,
  ui,
  useColors: true,
  reporter: headless ? "spec" : undefined,
  ignoreLeaks: true
});
