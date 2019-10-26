import { sum } from "./sum";
import chai from "chai";

suite("sum specs", () => {
  test("adds some numbers", () => {
    chai.expect(sum(1, 2)).to.equal(3);
  });
});
