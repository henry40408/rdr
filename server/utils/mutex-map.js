import { Mutex } from "async-mutex";

export class MutexMap {
  constructor() {
    /** @type {Map<string, import('async-mutex').Mutex} */
    this.map = new Map();
  }

  /**
   * @param {string} key
   * @returns {Promise<import('async-mutex').MutexInterface.Releaser>}
   */
  async acquire(key) {
    if (!this.map.has(key)) this.map.set(key, new Mutex());

    const mutex = this.map.get(key);
    if (!mutex) throw new Error("Mutex not found");

    return await mutex.acquire();
  }
}
