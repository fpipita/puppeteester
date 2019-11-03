import assert from "assert";
import path from "path";
import { Puppeteester } from "../../src/lib/puppeteester.js";
import { PuppeteesterConfigBuilder } from "../../src/lib/config-builder.js";

suite("Puppeteester class", () => {
  suite("ci mode", () => {
    test("test failures", async () => {
      const puppeteester = new Puppeteester(
        new PuppeteesterConfigBuilder()
          .nodeModules(path.resolve("example", "node_modules"))
          .sources(path.resolve("example", "src"))
      );
      const result = await puppeteester.ci();
      assert.equal(1, result.failures);
    });

    test("coverage report of source code only", async () => {
      const puppeteester = new Puppeteester(
        new PuppeteesterConfigBuilder()
          .nodeModules(path.resolve("example", "node_modules"))
          .sources(path.resolve("example", "src"))
          .coverage("/tmp")
      );
      const result = await puppeteester.ci();
      assert.equal(1, result.coverage.length);
      assert.ok(result.coverage[0].url.endsWith("sum.js"));
    });
  });
});
