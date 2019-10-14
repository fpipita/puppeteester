import assert from "assert";
import { Scheduler, MockTimer, TestTask } from "../src/test-runner";

describe("test runner class", () => {
  it("waits for active task to complete", async () => {
    const timer = new MockTimer();
    const scheduler = new Scheduler(timer);
    const task = new TestTask();
    timer.setNow(1001);
    scheduler.schedule(task);
    timer.setNow(1002);
    const p = scheduler.schedule(task);
    await p;
    assert.equal(1, task._calls);
  });
});
