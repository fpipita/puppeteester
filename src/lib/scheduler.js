import { EventEmitter } from "events";

/**
 * @template T
 * @callback TaskCompleteCallback
 * @param {T} result
 */

/**
 * @template T
 */
export class Scheduler extends EventEmitter {
  /**
   * @param {import("./timer").Timer} timer
   * @param {!number=} polling
   */
  constructor(timer, polling = 1000) {
    super();
    /** @type {Array<import("./task").Task<T>>} */
    this._queue = [];
    this._running = false;
    this._timer = timer;
    this._polling = polling;
  }

  /**
   *
   * @param {import("./task").Task<T>} task
   */
  schedule(task) {
    this._queue = [...new Set([...this._queue, task])];
  }

  async shutdown() {
    this._running = true;
    await this._pending;
    this._queue.forEach(task => task.cancel());
  }

  async start() {
    if (this._running) {
      return;
    }
    this._running = true;
    do {
      const task = this._queue.shift();
      if (task) {
        const result = await (this._pending = task.run());
        this.emit("taskcomplete", result);
      } else {
        await this._timer.wait(this._polling);
      }
    } while (this._running);
  }
}
