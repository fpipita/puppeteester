import { parse } from "../lib/configuration.js";
import { Puppeteester } from "../lib/puppeteester.js";

(async function() {
  const config = parse();
  const puppeteester = new Puppeteester(config);
  puppeteester.on("console", event => {
    console.log(...event.args);
  });
  if (config.mode === "ci") {
    const result = await puppeteester.ci();
    process.exit(result.failures > 0 ? 1 : 0);
  } else {
    puppeteester.watch();
  }
})();
