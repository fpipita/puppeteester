export class Timer {
  /**
   * @param {!number} milliseconds
   * @returns {Promise}
   */
  // eslint-disable-next-line no-unused-vars
  async wait(milliseconds) {
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
   * @param {!number=} polling
   */
  constructor(timer, polling = 1000) {
    /** @type {Array.<Task>} */
    this._queue = [];
    this._pending = null;
    this._running = false;
    this._timer = timer;
    this._polling = polling;
  }

  /**
   *
   * @param {Task} task
   */
  schedule(task) {
    this._queue = [...new Set([...this._queue, task])];
  }

  async stop() {
    this._running = false;
    return this._pending;
  }

  async start() {
    if (this._running) {
      return;
    }
    this._running = true;
    do {
      const task = this._queue.shift();
      if (task) {
        await (this._pending = task.run());
      } else {
        await this._timer.wait(this._polling);
      }
    } while (this._running);
  }
}

export class TestTask extends Task {
  /**
   *
   * @param {Timer} timer
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

export class DefaultTimer extends Timer {
  /**
   * @param {!number} milliseconds
   */
  wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }
}

export class DeferredPromise {
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  resolve() {
    this._resolve();
    return this;
  }

  reject() {
    this._reject();
    return this;
  }
}

export class MockTimer extends Timer {
  constructor() {
    super();
    /** @type {Map.<number, DeferredPromise>} */
    this._requests = new Map();
    this._elapsed = 0;
  }

  /**
   * @param {!number} milliseconds
   * @returns {Promise}
   */
  wait(milliseconds) {
    const time = milliseconds + this._elapsed;
    let deferred = this._requests.get(time);
    if (typeof deferred === "undefined") {
      deferred = new DeferredPromise();
      this._requests.set(time, deferred);
    }
    return deferred.promise;
  }

  /**
   * @param {!number} milliseconds
   */
  async flush(milliseconds) {
    this._elapsed += milliseconds;
    for (const [time, deferred] of this._requests.entries()) {
      if (time <= this._elapsed) {
        await deferred.resolve().promise;
        this._requests.delete(time);
      }
    }
  }
}
