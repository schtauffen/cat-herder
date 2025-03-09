
import type {Key, ComponentStore} from './slot-map.js';

export class ZeroStore implements ComponentStore<unknown> {
  * [Symbol.iterator]() {
    // No-op
  }

  get(_key: Key): void {
    // No-op
  }

  set(_key: Key, _value: unknown): void {
    // No-op
  }

  has(_key: Key): boolean {
    return false;
  }

  remove(_key: Key): void {
    // No-op
  }

  drain(): Iterable<[Key, unknown]> {
    return [];
  }

  size(): number {
    return 0;
  }
}
