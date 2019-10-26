export class Deferred {
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
