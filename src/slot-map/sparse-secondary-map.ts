import type {Key, ComponentStore} from './slot-map.js';

type Slot<T> = {
  generation: number;
  value: T;
};

export class SparseSecondaryMap<T> implements ComponentStore<T> {
  readonly #slots = new Map<number, Slot<T>>();

  * [Symbol.iterator]() {
    for (const slot of this.#slots.values()) {
      yield slot.value;
    }
  }

  public set(key: Key, value: T): T | undefined {
    let slot = this.#slots.get(key.index);
    if (slot !== undefined && key.generation < slot.generation) {
      return undefined;
    }

    if (slot === undefined) {
      slot = {generation: key.generation, value};
      this.#slots.set(key.index, slot);
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
    const slot = this.#slots.get(key.index);
    return slot !== undefined && slot.generation === key.generation;
  }

  public get(key: Key): T | undefined {
    const slot = this.#slots.get(key.index);
    if (slot === undefined || slot.generation !== key.generation) {
      return undefined;
    }

    return slot.value;
  }

  public remove(key: Key): T | undefined {
    const slot = this.#slots.get(key.index);
    if (slot === undefined || slot.generation !== key.generation) {
      return undefined;
    }

    const removed = slot.value;
    this.#slots.delete(key.index);
    return removed;
  }

  public clear() {
    this.#slots.clear();
  }

  public drain(): Iterable<[Key, T]> {
    const values = Array.from(this.#slots.entries());
    this.#slots.clear();

    return (function * () {
      for (const [number, slot] of values) {
        yield [{index: number, generation: slot.generation}, slot.value];
      }
    })();
  }

  public size(): number {
    return this.#slots.size;
  }
}
