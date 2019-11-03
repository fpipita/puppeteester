import { EventEmitter } from "events";

/**
 * @template T
 */
export class Task extends EventEmitter {
  /**
   * @returns {Promise<T>}
   */
  async run() {
    throw new TypeError("Abstract method");
  }

  /**
   * @return {Promise}
   */
  async cancel() {
    throw new TypeError("Abstract method");
  }
}

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
    /** @type {Array<Task<T>>} */
    this._queue = [];
    this._running = false;
    this._timer = timer;
    this._polling = polling;
  }

  /**
   *
   * @param {Task<T>} task
   */
  schedule(task) {
    this._queue = [...new Set([...this._queue, task])];
  }

  async shutdown() {
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

export class TestTask extends Task {
  /**
   *
   * @param {import("./timer").Timer} timer
   * @param {!number=} duration
   * @param {function=} callback
   */
  constructor(timer, duration = 100, callback = () => {}) {
    super();
    this._timer = timer;
    this._calls = 0;
    this._callback = callback;
    this._duration = duration;
  }

  async run() {
    await this._timer.wait(this._duration);
    this._calls++;
    this._callback(this._calls);
  }
}
