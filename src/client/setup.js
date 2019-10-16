import "/puppeteester/node_modules/mocha/mocha.js?nomodule=true";
import { headless, ui } from "./config.js";

const config = { ui };
if (headless) {
  config.reporter = "spec";
}
mocha.setup(config);
mocha.useColors(true);

(window.after || window.suiteTeardown)(() => {
  const container = document.querySelector("#mocha");
  if (container) {
    container.setAttribute("done", "true");
  }
});
