export default class Mutex {
  private _locked = false;
  private _queue: Array<(value: void | PromiseLike<void>) => void> = [];

  get isLocked(): boolean {
    return this._locked === true;
  }

  constructor() {}

  async lock(): Promise<void> {
    return new Promise((resolve) => {
      if (!this._locked) {
        this._locked = true;
        resolve();
      } else {
        this._queue.push(resolve);
      }
    });
  }

  unlock(): void {
    const next = this._queue.shift();
    if (next) {
      next();
    } else {
      this._locked = false;
    }
  }
}
