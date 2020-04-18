import { Deferred } from "./deferred.js";

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

export class DefaultTimer extends Timer {
  /**
   * @param {!number} milliseconds
   */
  wait(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}

export class MockTimer extends Timer {
  constructor() {
    super();
    /** @type {Map<number, Deferred>} */
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
      deferred = new Deferred();
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
        await deferred.resolve(null).promise;
        this._requests.delete(time);
      }
    }
  }
}
