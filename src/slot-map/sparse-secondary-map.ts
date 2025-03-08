import type {Key, SecondaryMap} from './slot-map.js';

type Slot<T> = {
  generation: number;
  value: T;
};

export class SparseSecondaryMap<T> implements SecondaryMap<T> {
  _slots = new Map<number, Slot<T>>();

  * [Symbol.iterator]() {
    for (const slot of this._slots.values()) {
      yield slot.value;
    }
  }

  public set(key: Key, value: T): T | undefined {
    let slot = this._slots.get(key.index);
    if (slot !== undefined && key.generation < slot.generation) {
      return undefined;
    }

    if (slot === undefined) {
      slot = {generation: key.generation, value};
      this._slots.set(key.index, slot);
      return undefined;
    }

    if (slot.generation === key.generation) {
      const replaced = slot.value;
      slot.value = value;
      return replaced;
    }

    slot.generation = key.generation;
    slot.value = value;
    return undefined;
  }

  public has(key: Key): boolean {
    const slot = this._slots.get(key.index);
    return slot !== undefined && slot.generation === key.generation;
  }

  public get(key: Key): T | undefined {
    const slot = this._slots.get(key.index);
    if (slot === undefined || slot.generation !== key.generation) {
      return undefined;
    }

    return slot.value;
  }

  public remove(key: Key): T | undefined {
    const slot = this._slots.get(key.index);
    if (slot === undefined || slot.generation !== key.generation) {
      return undefined;
    }

    const removed = slot.value;
    this._slots.delete(key.index);
    return removed;
  }

  public clear() {
    this._slots.clear();
  }

  public size(): number {
    return this._slots.size;
  }
}
