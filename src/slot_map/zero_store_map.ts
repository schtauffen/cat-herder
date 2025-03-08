/* eslint-disable @typescript-eslint/no-unused-vars */
import type { IKey, ISecondaryMap } from "./slot_map";

export class ZeroStoreMap implements ISecondaryMap<unknown> {
  *[Symbol.iterator]() {
    // No-op
  }

  get(_key: IKey): void {
    // No-op
  }

  set(_key: IKey, _value: unknown): void {
    // No-op
  }

  has(_key: IKey): boolean {
    return false;
  }

  remove(_key: IKey): void {
    // No-op
  }

  size(): number {
    return 0;
  }
}
