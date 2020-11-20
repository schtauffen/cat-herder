/* eslint-disable @typescript-eslint/no-explicit-any */
import BitSet from "bitset";
import { Cast, Prepend, Pos, Reverse, Length, Next } from "./type-utils";
import { IdentityPool } from "./identity";

type QueryResult<T extends ComponentFactory> = T extends typeof Entity
  ? number
  : ReturnType<T>;

type ReturnTypesInternal<
  T extends ComponentFactory[],
  R extends any[] = [],
  I extends any[] = []
> = {
  0: ReturnTypesInternal<T, Prepend<QueryResult<T[Pos<I>]>, R>, Next<I>>;
  1: R;
}[Pos<I> extends Length<T> ? 1 : 0];

type ReturnTypes<T extends ComponentFactory[]> = ReturnTypesInternal<
  Reverse<T> extends infer U ? Cast<U, any[]> : never,
  [],
  []
>;

// TODO - also allow classes
// TODO - more ergonomic handling (instead of .with(Name)(...args))
//    export const Component = component(() => {...}) ??
//    -> with(Name(...args))
//    also lets us go back to using an integer with array instead of Map<ComponentFactory, ..>
// TODO - allow selection of Array or Map for speed characteristics?
export type Component = Record<string, any>;
export interface ComponentFactory {
  (...args: any): Component;
}

// TODO - allow tag components to not require storing data in array
export const Tag: () => ComponentFactory = () => () => ({});

export function Entity(): { "@@entity": true } {
  throw new Error("Construct entities with World#entity()");
}

export type System<R> = (world: IWorld<R>) => void;

//  World
//    Resources ✓
//    Entities ✓
//    Components ✓
//    Systems // TODO - evaluate parrallel execution in the future
export interface IWorld<R = Record<string, any>> {
  // Entities
  entity(): IEntityBuilder;
  delete(entity: number): void;

  // Components
  register(factory: ComponentFactory): IWorld<R>;
  get<T extends ComponentFactory>(
    factory: T,
    entity: number,
  ): ReturnType<T> | null;
  add<T extends ComponentFactory>(
    factory: T,
    entity: number,
  ): BoundFactory<void, T>;
  remove(factory: ComponentFactory, entity: number): void;
  query_iter<T extends ComponentFactory[]>(
    ...factories: T
  ): IQuery<ReturnTypes<T>>;
  query<T extends ComponentFactory[]>(
    ...factories: T
  ): IQueryBuilder<ReturnTypes<T>[]>;

  // Systems
  system(sys: System<R>): IWorld<R>;
  update(): void;

  resources: R;
}

export type BoundFactory<R, T extends ComponentFactory> = (
  ...args: Parameters<T>
) => R;

export interface IEntityBuilder {
  with<T extends ComponentFactory>(factory: T): BoundFactory<IEntityBuilder, T>;
  build(): number;
}

export interface IQuery<R> extends IterableIterator<R> {
  not(...factories: ComponentFactory[]): IQuery<R>;
  collect(): R[];
}

export interface IQueryBuilder<R> {
  not(...factories: ComponentFactory[]): IQueryBuilder<R>;
  result(): R;
}

const ZERO_BITSET = new BitSet();
export function World<R = Record<string, any>>(resources: R): IWorld<R> {
  const componentIds = IdentityPool();
  const entityIds = IdentityPool();
  const componentsMap: Map<ComponentFactory, Component[]> = new Map();
  const componentsBit: Map<ComponentFactory, number> = new Map();
  const entities: Map<number, BitSet> = new Map();
  const systems: System<R>[] = [];

  function toBitset(factories: ComponentFactory[]): BitSet {
    const bitset = new BitSet();

    for (const factory of factories) {
      if (factory === Entity) {
        continue;
      }

      const bit = componentsBit.get(factory);
      if (typeof bit === "undefined") {
        throw new TypeError(
          `Attempted to query unknown Component: ${factory.name}`,
        );
      }

      bitset.set(bit, 1);
    }

    return bitset;
  }

  let world: IWorld<R>;
  return (world = {
    resources,

    register(factory: ComponentFactory) {
      componentsMap.set(factory, []);
      componentsBit.set(factory, componentIds.get());
      return (world as unknown) as IWorld<R>;
    },

    get<T extends ComponentFactory>(factory: T, entity: number) {
      const components = componentsMap.get(factory);
      if (components === undefined) {
        throw new TypeError(
          `Attempted to get unknown Component: ${factory.name}`,
        );
      }

      const component = components[entity];
      return typeof component === "undefined"
        ? null
        : (component as ReturnType<T>);
    },

    query_iter<T extends ComponentFactory[]>(
      ...factories: T
    ): IQuery<ReturnTypes<T>> {
      const has = toBitset(factories);
      let hasnt = new BitSet();
      let pristine = true;

      const iterator: any = (function* () {
        pristine = false;

        for (const [entity, bitset] of entities.entries()) {
          if (
            has.and(bitset).equals(has) &&
            hasnt.and(bitset).equals(ZERO_BITSET)
          ) {
            const result = new Array(factories.length);
            for (const [idx, factory] of factories.entries()) {
              result[idx] =
                factory === Entity
                  ? entity
                  : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    componentsMap.get(factory)![entity];
            }
            yield result;
          }
        }
      })();

      // TODO - is there a native method for this?
      iterator.collect = () => {
        if (!pristine) {
          throw new Error(
            `#collect() only expected to be called on pristine query.`,
          );
        }
        const result = [];

        for (const r of iterator) {
          result.push(r);
        }

        return (result as unknown) as ReturnTypes<T>[];
      };

      iterator.not = (...without: ComponentFactory[]) => {
        if (!pristine) {
          throw new Error(
            `#not() only expected to be called on pristine query.`,
          );
        }
        hasnt = toBitset(without);
        return iterator;
      };

      return iterator as IQuery<ReturnTypes<T>>;
    },

    query<T extends ComponentFactory[]>(
      ...factories: T
    ): IQueryBuilder<ReturnTypes<T>[]> {
      const has = toBitset(factories);
      let hasnt = new BitSet();

      let query: IQueryBuilder<ReturnTypes<T>[]>;
      return (query = {
        not(...factories) {
          hasnt = toBitset(factories);
          return query;
        },

        // TODO - add lazy iterator: (lazy() ?)
        // TODO - might not need #result/lazy() call if we implement Iterator for QueryBuilder?
        result() {
          const results: any[] = [];
          for (const [entity, bitset] of entities.entries()) {
            if (
              has.and(bitset).equals(has) &&
              hasnt.and(bitset).equals(ZERO_BITSET)
            ) {
              const result = new Array(factories.length);
              for (const [idx, factory] of factories.entries()) {
                result[idx] =
                  factory === Entity
                    ? entity
                    : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                      componentsMap.get(factory)![entity];
              }
              results.push(result);
            }
          }

          return (results as unknown) as ReturnTypes<T>[];
        },
      });
    },

    entity() {
      const parts: [any, any][] = [];
      let builder: IEntityBuilder;

      return (builder = {
        with<T extends ComponentFactory>(factory: T) {
          return function (...args: Parameters<T>) {
            parts.push([factory, args]);
            return builder;
          };
        },

        build() {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const entity = entityIds.get();

          const entityMask = new BitSet();
          for (const [factory, args] of parts) {
            const bit = componentsBit.get(factory);
            const components = componentsMap.get(factory);
            if (bit === undefined || components === undefined) {
              throw new TypeError(
                `Attempted to add unknown Component to entity: ${factory.name}`,
              );
            }

            components[entity] = factory(...args);
            entityMask.set(bit, 1);
          }
          entities.set(entity, entityMask);
          return entity;
        },
      });
    },

    add<T extends ComponentFactory>(
      factory: T,
      entity: number,
    ): BoundFactory<void, T> {
      return (...args: Parameters<T>) => {
        const entityMask = entities.get(entity);
        if (entityMask === undefined) {
          throw new TypeError(`Attempted to add Component to unknown entity.`);
        }

        const bit = componentsBit.get(factory);
        const components = componentsMap.get(factory);
        if (bit === undefined || components === undefined) {
          throw new TypeError(
            `Attempted to add unknown Component to entity: ${factory.name}`,
          );
        }

        components[entity] = factory(...(args as any)); // TODO - why is this cast to any needed?
        entityMask.set(bit, 1);
      };
    },

    remove(factory: ComponentFactory, entity: number) {
      const bit = componentsBit.get(factory);
      const components = componentsMap.get(factory);
      if (bit === undefined || components === undefined) {
        throw new TypeError(
          `Attempted to remove unknown Component: ${factory.name}`,
        );
      }

      const entityMask = entities.get(entity);
      if (entityMask === undefined) {
        throw new TypeError(
          `Attempted to remove Component from unknown entity.`,
        );
      }

      delete components[entity];
      entityMask.set(bit, 0);
    },

    delete(entity: number) {
      const entityMask = entities.get(entity);
      if (!entityMask) {
        return;
      }

      // TODO - would get cleaned up by transition to number id'd components
      // TODO - delay and batch?
      const toDelete = entityMask.toArray();
      for (const [factory, bit] of componentsBit.entries()) {
        if (toDelete.indexOf(bit) !== -1) {
          world.remove(factory, entity);
        }
      }

      entities.delete(entity);
      entityIds.retire(entity);
    },

    // TODO - scheduling? disabling?
    system(sys: System<R>): IWorld<R> {
      systems.push(sys);
      return world;
    },

    update(): void {
      for (const sys of systems) {
        sys(world);
      }
    },
  } as IWorld<R>);
}
