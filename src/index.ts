/* eslint-disable @typescript-eslint/ban-types */

import {BitSet} from 'bitset';
import type {
  Cast, Prepend, Pos, Reverse, Length, Next,
} from './type-utils.js';
import {IdentityPool} from './identity.js';
import {type Key, SlotMap, type SecondaryMap as SecondaryMapType} from './slot-map/slot-map.js';
import {SecondaryMap} from './slot-map/secondary-map.js';
import {ZeroStoreMap} from './slot-map/zero-store-map.js';
import {bindAllMethods} from './util/bind-all-methods.js';

const entityAttribute = '@@entity';
const tagAttribute = '@@tag';

type SecondaryMapConstructor<T> = {
  new (): SecondaryMap<T>;
  withCapacity?(capacity: number): SecondaryMapType<T>;
};

type QueryResult<T extends ComponentFactory> = T extends {[entityAttribute]: true}
  ? Key
  : ReturnType<T>;

type ReturnTypesInternal<
  T extends ComponentFactory[],
  R extends any[] = [],
  I extends any[] = [],
> = {
  0: ReturnTypesInternal<T, Prepend<QueryResult<T[Pos<I>]>, R>, Next<I>>;
  1: R;
}[Pos<I> extends Length<T> ? 1 : 0];

type ReturnTypes<T extends ComponentFactory[]> = ReturnTypesInternal<
Reverse<T> extends infer U ? Cast<U, any[]> : never
>;

// TODO
// - allow classes
// - more ergonomic handling (instead of .with(Name)(...args))
// - export const Component = component(() => {...}) ??
//    -> with(Name(...args))
//   lets us go back to using an integer with array instead of Map<ComponentFactory, ..>
// - allow selection of Array or Map for speed characteristics?
// - determine if the no-op store is Ok or if more !factory[tagAttribute] is prudent

//  World
//    Resources ✓
//    Entities ✓
//    Components ✓
//    Systems - evaluate parrallel execution, scheduling, disabling

export type Component = Record<string, any>;
export type ComponentFactory = {
  (...arguments_: any): Component;

  [tagAttribute]?: boolean;
  [entityAttribute]?: boolean;
};

const zeroStoreMap = new ZeroStoreMap();

export function createTag(): ComponentFactory {
  return Object.assign(() => ({}), {[tagAttribute]: true});
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const Entity = Object.assign(
  (): never => {
    throw new Error('Construct entities with World#entity()');
  },
  {[entityAttribute]: true},
);

export type System<R> = (world: World<R>) => void;

export type BoundFactory<R, T extends ComponentFactory> = (
  ...arguments_: Parameters<T>
) => R;

export class EntityBuilder<E = any> {
  readonly #store: EcsStore<E>;
  readonly #parts: Array<[ComponentFactory, any[]]> = [];

  constructor(store: EcsStore<E>) {
    this.#store = store;
  }

  with<T extends ComponentFactory>(factory: T): BoundFactory<this, T> {
    return (...arguments_: Parameters<T>) => {
      this.#parts.push([factory, arguments_]);
      return this;
    };
  }

  build(): Key {
    const entityMask = new BitSet();
    const entity = this.#store.entities.add(entityMask);

    for (const [factory, arguments_] of this.#parts) {
      const bit = this.#store.componentBits.get(factory);
      const components = this.#store.componentsMap.get(factory);
      if (bit === undefined || components === undefined) {
        throw new TypeError(
          `Attempted to add unknown Component to entity: ${factory.name}`,
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      components.set(entity, factory(...arguments_));
      entityMask.set(bit, 1);
    }

    return entity;
  }
}

export class Query<R, E = any> implements Iterable<R> {
  readonly #store: EcsStore<E>;
  readonly #factories: ComponentFactory[];
  readonly #has: BitSet;

  #hasnt = new BitSet();
  #pristine = true;

  constructor(store: EcsStore<E>, factories: ComponentFactory[]) {
    this.#store = store;
    this.#factories = factories;
    this.#has = store.factoriesToBitSet(factories);
  }

  * [Symbol.iterator]() {
    this.#pristine = false;

    for (const [entity, bitset] of this.#store.entities.entries()) {
      if (
        this.#has.and(bitset).equals(this.#has)
          && this.#hasnt.and(bitset).equals(zeroBitSet)
      ) {
        const result = Array.from({length: this.#factories.length});
        for (const [index, factory] of this.#factories.entries()) {
          if (factory[entityAttribute]) {
            result[index] = entity;
          } else if (factory[tagAttribute]) {
            result[index] = true;
          } else {
            result[index] = this.#store.componentsMap.get(factory)?.get(entity);
          }
        }

        yield result as unknown as R;
      }
    }
  }

  not(...without: ComponentFactory[]): this {
    if (!this.#pristine) {
      throw new Error(
        '#not() only expected to be called on pristine query.',
      );
    }

    this.#hasnt = this.#store.factoriesToBitSet(without).or(this.#hasnt);
    return this;
  }

  collect(): R[] {
    if (!this.#pristine) {
      throw new Error(
        '#collect() only expected to be called on pristine query.',
      );
    }

    return [...this];
  }
}

class EcsStore<R> {
  public entities = new SlotMap<BitSet>();
  public componentIds = new IdentityPool();
  public componentsMap = new Map<ComponentFactory, SecondaryMapType<unknown>>();
  public componentBits = new Map<ComponentFactory, number>();
  public systems: Array<System<R>> = [];

  constructor() {
    bindAllMethods(this);
  }

  public factoriesToBitSet(factories: ComponentFactory[]): BitSet {
    const bitset = new BitSet();

    for (const factory of factories) {
      if (factory[entityAttribute]) {
        continue;
      }

      const bit = this.componentBits.get(factory);
      if (bit === undefined) {
        throw new TypeError(
          `Attempted to query unknown Component: ${factory.name}`,
        );
      }

      bitset.set(bit, 1);
    }

    return bitset;
  }
}

const zeroBitSet = new BitSet();

export class World<R = Record<string, unknown>> {
  readonly #store = new EcsStore<R>();

  constructor(public readonly resources: R) {
    bindAllMethods(this);
  }

  /**
   * Entity API
   */
  entity(): EntityBuilder {
    return new EntityBuilder(this.#store);
  }

  delete(entity: Key): void {
    // Can just be overwritten lazily for now with SlotMaps
    // const entityMask = entities.get(entity);
    // if (!entityMask) {
    //   return;
    // }

    // TODO - delay and batch?
    // const toDelete = entityMask.toArray();
    // for (const [factory, bit] of this.#componentBits.entries()) {
    //   if (toDelete.indexOf(bit) !== -1) {
    //     world.remove(factory, entity);
    //   }
    // }

    this.#store.entities.remove(entity);
  }

  /**
   * Component API
   */
  public register<T extends ComponentFactory>(
    factory: T,
    secondaryType: SecondaryMapConstructor<T> = SecondaryMap,
  ): this {
    let secondary: SecondaryMapType<T>;
    if (factory[tagAttribute]) {
      secondary = zeroStoreMap as SecondaryMapType<T>;
    } else if (secondaryType.withCapacity === undefined) {
      secondary = new SecondaryMap();
    } else {
      secondary = secondaryType.withCapacity(this.#store.entities.size());
    }

    this.#store.componentsMap.set(factory, secondary);
    this.#store.componentBits.set(factory, this.#store.componentIds.get());
    return this;
  }

  get<T extends ComponentFactory>(factory: T, entity: Key): ReturnType<T> | null {
    const components = this.#store.componentsMap.get(factory);
    if (components === undefined) {
      throw new TypeError(
        `Attempted to get unknown Component: ${factory.name}`,
      );
    }

    const component = components.get(entity);
    return component === undefined
      ? null
      : (component as ReturnType<T>);
  }

  add<T extends ComponentFactory>(
    factory: T,
    entity: Key,
  ): BoundFactory<this, T> {
    return (...arguments_: Parameters<T>) => {
      const entityMask = this.#store.entities.get(entity);
      if (entityMask === undefined) {
        throw new TypeError('Attempted to add Component to unknown entity.');
      }

      const bit = this.#store.componentBits.get(factory);
      const components = this.#store.componentsMap.get(factory);
      if (bit === undefined || components === undefined) {
        throw new TypeError(
          `Attempted to add unknown Component to entity: ${factory.name}`,
        );
      }

      components.set(entity, factory(...(arguments_)));
      entityMask.set(bit, 1);

      return this;
    };
  }

  remove(factory: ComponentFactory, entity: Key): this {
    const bit = this.#store.componentBits.get(factory);
    const components = this.#store.componentsMap.get(factory);
    if (bit === undefined || components === undefined) {
      throw new TypeError(
        `Attempted to remove unknown Component: ${factory.name}`,
      );
    }

    const entityMask = this.#store.entities.get(entity);
    if (entityMask === undefined) {
      throw new TypeError(
        'Attempted to remove Component from unknown entity.',
      );
    }

    components.remove(entity);
    entityMask.set(bit, 0);
    return this;
  }

  query<T extends ComponentFactory[]>(
    ...factories: T
  ): Query<ReturnTypes<T>> {
    return new Query<ReturnTypes<T>>(this.#store, factories);
  }

  /**
   * System API
   */
  system(system: System<R>): this {
    this.#store.systems.push(system);
    return this;
  }

  update(): void {
    for (const system of this.#store.systems) {
      system(this);
    }
  }
}
