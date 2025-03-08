import type {Key, SecondaryMap as SecondaryMapType} from './slot-map.js';

type Slot<T> = {
  generation: number;
  occupied: boolean;
  value: T;
};

export class SecondaryMap<T> implements SecondaryMapType<T> {
  static withCapacity<T>(capacity: number) {
    const sm = new SecondaryMap<T>();
    sm.growCapacity(capacity);
    return sm;
  }

  readonly #slots: Array<Slot<T>> = [];
  #capacity = 0;
  #size = 0;

  * [Symbol.iterator]() {
    for (const slot of this.#slots) {
      if (slot.occupied) {
        yield slot.value;
      }
    }
  }

  public set(key: Key, value: T): T | undefined {
    if (key.index >= this.#capacity) {
      this.growCapacity(key.index + 1);
    }

    const slot = this.#slots[key.index];
    if (key.generation < slot.generation) {
      return undefined;
    }

    if (!slot.occupied) {
      this.#size += 1;
      slot.occupied = true;
    } else if (slot.generation === key.generation) {
      const replaced = slot.value;
      slot.value = value;
      return replaced;
    }

    slot.generation = key.generation;
    slot.value = value;
    return undefined;
  }

  public has(key: Key): boolean {
    const slot = this.#slots[key.index];
    return (
      slot !== undefined && slot.generation === key.generation && slot.occupied
    );
  }

  public get(key: Key): T | undefined {
    const slot = this.#slots[key.index];
    if (
      slot === undefined
      || slot.generation !== key.generation
      || !slot.occupied
    ) {
      return undefined;
    }

    return slot.value;
  }

  public remove(key: Key): T | undefined {
    const slot = this.#slots[key.index];
    if (
      slot === undefined
      || slot.generation !== key.generation
      || !slot.occupied
    ) {
      return undefined;
    }

    this.#size -= 1;
    const removed = slot.value;
    slot.value = undefined as unknown as T;
    slot.occupied = false;
    return removed;
  }

  public clear() {
    for (const slot of this.#slots) {
      slot.value = undefined as unknown as T;
      slot.occupied = false;
    }

    this.#size = 0;
  }

  public size(): number {
    return this.#size;
  }

  protected growCapacity(capacity: number) {
    for (let index = this.#capacity; index < capacity; ++index) {
      this.#slots[index] = {
        generation: -1,
        value: undefined as unknown as T,
        occupied: false,
      };
    }

    this.#capacity = capacity;
  }
}
