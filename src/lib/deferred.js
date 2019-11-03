/**
 * @template T
 */
export class Deferred {
  constructor() {
    /** @type {Promise<T>} */
    this.promise = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  /**
   * @param {T} value
   */
  resolve(value) {
    this._resolve(value);
    return this;
  }

  /**
   * @param {T} rejection
   */
  reject(rejection) {
    this._reject(rejection);
    return this;
  }
}
