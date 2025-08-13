import { Mutex } from 'async-mutex';

export class MutexMap {
  private mutexes: Map<string, Mutex> = new Map();

  async acquire(key: string) {
    if (!this.mutexes.has(key)) this.mutexes.set(key, new Mutex());
    const mutex = this.mutexes.get(key)!;
    return await mutex.acquire();
  }
}
