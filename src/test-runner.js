export class Timer {
  /**
   * @returns {!number}
   */
  now() {
    throw new TypeError("Abstract method");
  }
}

export class Task {
  async run() {
    throw new TypeError("Abstract method");
  }
}

export class DefaultTimer extends Timer {
  now() {
    return Date.now();
  }
}

export class Scheduler {
  /**
   * @param {Timer} timer
   * @param {number} throttle
   */
  constructor(timer = new DefaultTimer(), throttle = 1000) {
    this._running = Promise.resolve();
    this._throttle = throttle;
    this._timer = timer;
    this._lastScheduled = timer.now();
  }

  /**
   *
   * @param {Task} task
   * @returns {Promise}
   */
  async schedule(task) {
    const now = this._timer.now();
    const elapsed = now - this._lastScheduled;
    if (elapsed <= this._throttle) {
      return this._running;
    }
    this._lastScheduled = now;
    this._running = task.run();
    return this._running;
  }
}
