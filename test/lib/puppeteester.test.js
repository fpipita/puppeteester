import assert from "assert";
import path from "path";
import { parse } from "../../src/lib/configuration.js";
import { Puppeteester } from "../../src/lib/puppeteester.js";

suite("Puppeteester class", () => {
  suite("ci mode", () => {
    test("test failures", async () => {
      const puppeteester = new Puppeteester(
        parse([
          "--sources",
          path.resolve("test", "lib", "__fixtures__", "base"),
          "ci",
        ])
      );
      const result = await puppeteester.ci();
      assert.equal(1, result.failures);
    });

    test("coverage report of source code only", async () => {
      const puppeteester = new Puppeteester(
        parse([
          "--sources",
          path.resolve("test", "lib", "__fixtures__", "base"),
          "--coverage",
          "--coverage-output",
          "/tmp",
          "ci",
        ])
      );
      const result = await puppeteester.ci();
      assert.equal(2, result.coverage?.length);
      assert.ok(result.coverage?.[0].url.endsWith("sum.js"));
    });

    test("exception propagation", async () => {
      const puppeteester = new Puppeteester(
        parse([
          "--sources",
          path.resolve("test", "lib", "__fixtures__", "base"),
          "--chrome-executable-path",
          "/foo",
          "ci",
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
