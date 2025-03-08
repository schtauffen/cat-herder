
import type {Key, SecondaryMap} from './slot-map.js';

export class ZeroStoreMap implements SecondaryMap<unknown> {
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

  size(): number {
    return 0;
  }
}
