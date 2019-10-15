import { sum } from "./sum";
import chai from "chai";

describe("sum specs", () => {
  it("adds some numbers", () => {
    chai.expect(sum(1, 2)).to.equal(3);
  });
});
