import { sum } from "./sum";
import chai from "chai";

suite("sum specs", () => {
  test("adds some numbers", () => {
    chai.assert.equal(sum(1, 2), 3);
  });

  test("failing spec", () => {
    chai.assert.equal(sum(1, 2), 4);
  });

  test("no arguments", () => {
    chai.assert.throws(() => sum());
  });
});
