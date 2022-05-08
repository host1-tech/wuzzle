import { isNil } from 'lodash';

export class SyncMode<T = unknown> {
  readonly defaultRet: T;

  _ret: T;
  get ret(): T {
    return this._ret;
  }

  _err: unknown;
  get err(): unknown {
    return this._err;
  }

  _enabled: boolean;
  get enabled() {
    return this._enabled;
  }

  constructor(defaultRet: T) {
    this.defaultRet = defaultRet;
    this._ret = defaultRet;
    this._err = null;
    this._enabled = false;
  }

  saveRet(ret: T): T {
    if (this._enabled) {
      this._ret = ret;
    }
    return ret;
  }

  makeErr(err: unknown): T {
    this._err = err;
    return this.defaultRet;
  }

  start(): void {
    this._ret = this.defaultRet;
    this._err = null;
    this._enabled = true;
  }

  close(): void {
    this._enabled = false;
  }

  apply(fn: () => void): T {
    this.start();
    fn();
    this.close();
    if (!isNil(this._err)) {
      throw this._err;
    }
    return this._ret;
  }
}
