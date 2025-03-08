import type { IKey, ISecondaryMap } from "./slot_map";

type ISlot<T> = {
  generation: number;
  occupied: boolean;
  value: T;
};

export class SecondaryMap<T> implements ISecondaryMap<T> {
  _slots: ISlot<T>[] = [];
  _capacity = 0;
  _size = 0;

  static with_capacity<T>(capacity: number) {
    const sm = new SecondaryMap<T>();
    sm.grow_capacity(capacity);
    return sm;
  }

  *[Symbol.iterator]() {
    for (const slot of this._slots) {
      if (slot.occupied) {
        yield slot.value;
      }
    }
  }

  public set(key: IKey, value: T): T | undefined {
    if (key.index >= this._capacity) {
      this.grow_capacity(key.index + 1);
    }

    const slot = this._slots[key.index];
    if (key.generation < slot.generation) {
      return undefined;
    }

    if (slot.occupied === false) {
      this._size += 1;
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

  public has(key: IKey): boolean {
    const slot = this._slots[key.index];
    return (
      slot !== undefined && slot.generation === key.generation && slot.occupied
    );
  }

  public get(key: IKey): T | undefined {
    const slot = this._slots[key.index];
    if (
      slot === undefined ||
      slot.generation !== key.generation ||
      slot.occupied === false
    ) {
      return undefined;
    }

    return slot.value;
  }

  public remove(key: IKey): T | undefined {
    const slot = this._slots[key.index];
    if (
      slot === undefined ||
      slot.generation !== key.generation ||
      slot.occupied === false
    ) {
      return undefined;
    }

    this._size -= 1;
    const removed = slot.value;
    slot.value = undefined as unknown as T;
    slot.occupied = false;
    return removed;
  }

  public clear() {
    for (const slot of this._slots) {
      slot.value = undefined as unknown as T;
      slot.occupied = false;
    }
    this._size = 0;
  }

  public size(): number {
    return this._size;
  }

  protected grow_capacity(capacity: number) {
    for (let index = this._capacity; index < capacity; ++index) {
      this._slots[index] = {
        generation: -1,
        value: undefined as unknown as T,
        occupied: false,
      };
    }
    this._capacity = capacity;
  }
}
