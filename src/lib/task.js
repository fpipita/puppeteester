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

export class TimedTask extends Task {
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
