import assert from "assert";
import path from "path";
import { Puppeteester } from "../../src/lib/puppeteester.js";
import { parse } from "../../src/lib/configuration.js";

suite("Puppeteester class", () => {
  suite("ci mode", () => {
    test("test failures", async () => {
      const puppeteester = new Puppeteester(
        parse([
          "--node-modules",
          path.resolve("example", "node_modules"),
          "--sources",
          path.resolve("example", "src"),
          "ci"
        ])
      );
      const result = await puppeteester.ci();
      assert.equal(1, result.failures);
    });

    test("coverage report of source code only", async () => {
      const puppeteester = new Puppeteester(
        parse([
          "--node-modules",
          path.resolve("example", "node_modules"),
          "--sources",
          path.resolve("example", "src"),
          "--coverage",
          "--coverage-output",
          "/tmp",
          "ci"
        ])
      );
      const result = await puppeteester.ci();
      assert.equal(1, result.coverage.length);
      assert.ok(result.coverage[0].url.endsWith("sum.js"));
    });

    test("puppeteer thrown exceptions propagation", async () => {
      const puppeteester = new Puppeteester(
        parse([
          "--node-modules",
          path.resolve("example", "node_modules"),
          "--sources",
          path.resolve("example", "src"),
          "--chrome-executable-path",
          "/foo",
          "ci"
        ])
      );
      try {
        await puppeteester.ci();
        assert.fail();
        // eslint-disable-next-line no-empty
      } catch {}
    });
  });
});
