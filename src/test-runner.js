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

export class Scheduler {
  /**
   * @param {Timer} timer
   * @param {number} throttle
   */
  constructor(timer = new DefaultTimer(), throttle = 1000) {
    this._running = Promise.resolve();
    this._throttle = throttle;
    this._timer = timer;
    /**
     * this is needed in order to make sure first run is
     * always executed
     */
    this._lastScheduled = 0;
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

export class TestTask extends Task {
  /**
   *
   * @param {function=} callback
   */
  constructor(callback = () => {}) {
    super();
    this._calls = 0;
    this._callback = callback;
  }

  async run() {
    await new Promise(resolve => {
      setTimeout(resolve, 1000);
    });
    this._calls++;
    this._callback(this._calls);
  }
}

export class MockTimer extends Timer {
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

export class DefaultTimer extends Timer {
  now() {
    return Date.now();
  }
}
