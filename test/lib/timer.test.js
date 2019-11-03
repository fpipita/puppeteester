import assert from "assert";
import { MockTimer } from "../../src/lib/timer.js";

test("MockTimer class", async () => {
  const timer = new MockTimer();
  let called = false;
  (async () => {
    await timer.wait(100);
    called = true;
  })();
  await timer.flush(90);
  assert.equal(false, called);
  await timer.flush(11);
  assert.equal(true, called);
});
