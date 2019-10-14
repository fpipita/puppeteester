import assert from "assert";
import { Scheduler, Task, Timer } from "../src/test-runner";

class TestTask extends Task {
  constructor() {
    super();
    this._calls = 0;
  }

  async run() {
    await new Promise(resolve => {
      setTimeout(resolve, 1000);
    });
    this._calls++;
  }
}

class MockTimer extends Timer {
  constructor() {
    super();
    this._now = 0;
  }

  setNow(now) {
    this._now = now;
  }

  now() {
    return this._now;
  }
}

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
