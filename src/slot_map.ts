const INITIAL_SIZE = 8;

export interface IKey {
  index: number;
  generation: number;
}

// TODO - implement iterator
export interface ISlotMap<T> extends IterableIterator<T> {
  get(key: IKey): T | undefined;
  add(item: T): IKey;
  remove(key: IKey): boolean;
}

export function SlotMap<T>(): ISlotMap<T> {
  const indices: IKey[] = [];
  const data: (T | undefined)[] = [];
  const erase: number[] = [];
  const free: number[] = [];
  let capacity = 0;
  let size = 0;

  function grow_capacity(n: number) {
    for (let index = capacity; index < n; ++index) {
      indices[index] = { index: 0, generation: 1 };
      data[index] = undefined;
      free.push(index);
      erase[index] = 0;
    }
    capacity = n;
  }

  grow_capacity(INITIAL_SIZE);

  return Object.assign(function* () {
    // TODO - should warn or prevent editing while being accessed?
    for (let index = 0; index < size; ++index) {
      yield data[index]!;
    }
  }(), {
    get(key: IKey): T | undefined {
      const internal_key = indices[key.index];
      if (internal_key === undefined || key.generation !== internal_key.generation) {
        return undefined;
      }
      return data[internal_key.index];
    },

    add(item: T) {
      if (free.length === 0) {
        grow_capacity(2 * capacity);
      }

      const slot = free.shift()!;
      const internal_key = indices[slot];
      internal_key.index = size;
      data[size] = item;
      erase[size] = slot;
      size += 1;

      return  { index: slot, generation: internal_key.generation };
    },

    remove(key: IKey): boolean {
      const internal_key = indices[key.index];
      if (internal_key === undefined || key.generation !== internal_key.generation) {
        return false;
      }

      internal_key.generation += 1;
      const del_idx = internal_key.index;
      data[del_idx] = data[size - 1];
      data[size - 1] = undefined;
      const idx = erase[del_idx] = erase[size - 1];
      indices[idx].index = key.index;
      free.push(internal_key.index);
      size -= 1;

      return true;
    }
  });
}
