import assert from "assert";
import { Scheduler, TestTask } from "../src/scheduler.js";
import { MockTimer } from "../src/timer.js";

suite("test runner class", () => {
  test("executes duplicate tasks once", async () => {
    const timer = new MockTimer();
    const scheduler = new Scheduler(timer, 100);
    const task = new TestTask(timer);
    scheduler.schedule(task); // (1)
    scheduler.schedule(task); // (2) is rejected

    scheduler.start(); // task (1) is scheduled for execution

    await timer.flush(100);
    // 100ms: task (1) completes

    assert.equal(1, task._calls);
  });

  test("scheduling new tasks", async () => {
    const timer = new MockTimer();
    const scheduler = new Scheduler(timer, 100);
    const task = new TestTask(timer);
    scheduler.start();
    scheduler.schedule(task);

    await timer.flush(100);
    // 100ms: scheduler resumes from sleep, task (1) is scheduled for execution

    scheduler.schedule(task); // the queue is empty, task (2) is queued

    await timer.flush(100);
    // 200ms: task (1) completes, task (2) is scheduled for execution
    assert.equal(1, task._calls);

    await timer.flush(100);
    // 300ms: task (2) completes
    assert.equal(2, task._calls);
  });
});
