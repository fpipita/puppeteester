import assert from "assert";
import { EventEmitter } from "events";

/**
 * @template T
 */
export class Scheduler extends EventEmitter {
  /**
   * @param {import("./timer").Timer} timer
   * @param {number} polling
   */
  constructor(timer, polling = 1000) {
    super();
    /**
     * @type {import("./task").Task<T>[]}
     */
    this._queue = [];
    this._running = false;
    this._timer = timer;
    this._polling = polling;
    this._stopped = false;
  }

  /**
   * @param {import("./task").Task<T>} task
   */
  schedule(task) {
    assert.ok(!this._stopped, "scheduler has been stopped");
    this._queue = [...new Set([...this._queue, task])];
  }

  async shutdown() {
    this._running = false;
    this._stopped = true;
    try {
      await this._pending;
    } catch {
      this._pending = null;
    } finally {
      let task;
      while ((task = this._queue.shift())) {
        await task.cancel();
      }
    }
  }

  async start() {
    assert.ok(
      !this._running && !this._stopped,
      "scheduler already running or stopped"
    );
    this._running = true;
    do {
      const task = this._queue.shift();
      if (task) {
        try {
          const result = await (this._pending = task.run());
          this.emit("taskcomplete", result);
        } catch (e) {
          await task.cancel();
          this.emit("taskerror", task);
        }
      } else {
        await this._timer.wait(this._polling);
      }
    } while (this._running);
  }
}
