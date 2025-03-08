/* eslint-disable @typescript-eslint/no-non-null-assertion */
// Also: https://github.com/orlp/slotmap/blob/master/src - TODO: hop vs sparse vs basic
const INITIAL_SIZE = 8;

export interface IKey {
  index: number;
  generation: number;
}

interface ISlot extends IKey {
  occupied: boolean;
}

export type ISecondaryMap<T> = Iterable<T> & {
  get(key: IKey): T | undefined;
  set(key: IKey, value: T): T | undefined;
  has(key: IKey): boolean;
  remove(key: IKey): T | undefined;
  size(): number;
};

export interface ISlotMap<T> extends Iterable<T> {
  add(item: T): IKey;
  get(key: IKey): T | undefined;
  set(key: IKey, item: T): boolean;
  remove(key: IKey): boolean;
  size(): number;
  entries(): IterableIterator<[IKey, T]>;
}

export function SlotMap<T>(): ISlotMap<T> {
  const indices: ISlot[] = [];
  const data: (T | undefined)[] = [];
  const erase: number[] = [];
  const free: number[] = [];
  let capacity = 0;
  let size = 0;

  function grow_capacity(n: number) {
    for (let index = capacity; index < n; ++index) {
      indices[index] = { index: 0, generation: 1, occupied: false };
      data[index] = undefined;
      free.push(index);
      erase[index] = 0;
    }
    capacity = n;
  }

  grow_capacity(INITIAL_SIZE);

  return Object.assign(
    (function* () {
      // TODO - should warn or prevent editing while being accessed?
      for (let index = 0; index < size; ++index) {
        yield data[index]!;
      }
    })(),
    {
      *entries(): IterableIterator<[IKey, T]> {
        let returned = 0;

        // TODO - should warn or prevent editing while being accessed?
        let index = 0;
        while (returned < size) {
          const key_index = index++;
          const key = indices[key_index];
          if (key.occupied === false) {
            continue;
          }

          ++returned;
          yield [
            { index: key_index, generation: key.generation },
            data[key.index]!,
          ];
        }
      },

      get(key: IKey): T | undefined {
        const internal_key = indices[key.index];
        if (
          internal_key === undefined ||
          key.generation !== internal_key.generation
        ) {
          return undefined;
        }
        return data[internal_key.index];
      },

      set(key: IKey, item: T): boolean {
        const internal_key = indices[key.index];
        if (
          internal_key === undefined ||
          key.generation !== internal_key.generation ||
          internal_key.occupied === false
        ) {
          return false;
        }

        data[internal_key.index] = item;
        return true;
      },

      add(item: T) {
        if (free.length === 0) {
          grow_capacity(2 * capacity);
        }

        const slot = free.shift()!;
        const internal_key = indices[slot];
        internal_key.index = size;
        internal_key.occupied = true;
        data[size] = item;
        erase[size] = slot;
        size += 1;

        return { index: slot, generation: internal_key.generation };
      },

      size(): number {
        return size;
      },

      remove(key: IKey): boolean {
        const internal_key = indices[key.index];
        if (
          internal_key === undefined ||
          key.generation !== internal_key.generation ||
          internal_key.occupied === false
        ) {
          return false;
        }

        internal_key.generation += 1;
        internal_key.occupied = false;
        const del_idx = internal_key.index;
        data[del_idx] = data[size - 1];
        data[size - 1] = undefined;
        const idx = (erase[del_idx] = erase[size - 1]);
        indices[idx].index = del_idx;
        free.push(key.index);
        size -= 1;

        return true;
      },
    },
  );
}
