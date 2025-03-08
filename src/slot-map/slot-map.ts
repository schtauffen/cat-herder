
// Also: https://github.com/orlp/slotmap/blob/master/src - TODO: hop vs sparse vs basic
const initialSize = 8;

export type Key = {
  index: number;
  generation: number;
};

type Slot = {
  occupied: boolean;
} & Key;

export type SecondaryMap<T> = Iterable<T> & {
  get(key: Key): T | undefined;
  set(key: Key, value: T): T | undefined;
  has(key: Key): boolean;
  remove(key: Key): T | undefined;
  size(): number;
};

export class SlotMap<T> implements Iterable<T> {
  readonly #internalKeys: Slot[] = [];
  readonly #data: Array<T | undefined> = [];
  readonly #erase: number[] = [];
  readonly #free: number[] = [];
  #capacity = 0;
  #size = 0;

  constructor() {
    this.#growCapacity(initialSize);
  }

  * [Symbol.iterator]() {
    // TODO - warn or prevent editing while being accessed
    for (let index = 0; index < this.#size; ++index) {
      yield this.#data[index]!;
    }
  }

  * entries(): IterableIterator<[Key, T]> {
    let returned = 0;

    // TODO - should warn or prevent editing while being accessed?
    let index = 0;
    while (returned < this.#size) {
      const keyIndex = index++;
      const key = this.#internalKeys[keyIndex];
      if (!key.occupied) {
        continue;
      }

      ++returned;
      yield [
        {index: keyIndex, generation: key.generation},
        this.#data[key.index]!,
      ];
    }
  }

  get(key: Key): T | undefined {
    const internalKey = this.#internalKeys[key.index];
    if (
      internalKey === undefined
            || key.generation !== internalKey.generation
    ) {
      return undefined;
    }

    return this.#data[internalKey.index];
  }

  set(key: Key, item: T): boolean {
    const internalKey = this.#internalKeys[key.index];
    if (
      internalKey === undefined
            || key.generation !== internalKey.generation
            || !internalKey.occupied
    ) {
      return false;
    }

    this.#data[internalKey.index] = item;
    return true;
  }

  add(item: T) {
    if (this.#free.length === 0) {
      this.#growCapacity(2 * this.#capacity);
    }

    const slot = this.#free.shift()!;
    const internalKey = this.#internalKeys[slot];
    internalKey.index = this.#size;
    internalKey.occupied = true;
    this.#data[this.#size] = item;
    this.#erase[this.#size] = slot;
    this.#size += 1;

    return {index: slot, generation: internalKey.generation};
  }

  size(): number {
    return this.#size;
  }

  remove(key: Key): boolean {
    const internalKey = this.#internalKeys[key.index];
    if (
      internalKey === undefined
            || key.generation !== internalKey.generation
            || !internalKey.occupied
    ) {
      return false;
    }

    internalKey.generation += 1;
    internalKey.occupied = false;
    const deleting = internalKey.index;
    this.#data[deleting] = this.#data[this.#size - 1];
    this.#data[this.#size - 1] = undefined;
    this.#erase[deleting] = this.#erase[this.#size - 1];
    const index = this.#erase[deleting];
    this.#internalKeys[index].index = deleting;
    this.#free.push(key.index);
    this.#size -= 1;

    return true;
  }

  #growCapacity(capacity: number) {
    for (let index = this.#capacity; index < capacity; ++index) {
      this.#internalKeys[index] = {index: 0, generation: 1, occupied: false};
      this.#data[index] = undefined;
      this.#free.push(index);
      this.#erase[index] = 0;
    }

    this.#capacity = capacity;
  }
}
