/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable new-cap */
import {
  describe, it, expect, beforeEach,
} from 'vitest';
import {
  Entity, World, type ComponentFactory, createTag,
} from '../index.js';

describe('Entity', () => {
  it('should throw error', () => {
    expect(() => {
      Entity();
    }).toThrow('World#entity()');
  });
});

describe('World', () => {
  it('should create', () => {
    expect(new World({})).toBeTruthy();
  });

  describe('Entities', () => {
    describe('entity', () => {
      it('should return entity builder', () => {
        const world = new World({});

        const entity0 = world.entity().build();
        const entity1 = world.entity().build();
        const result = world.query(Entity).collect();

        expect(result).toEqual([[entity0], [entity1]]);
      });

      it('should throw when given unregistered component', () => {
        const world = new World({});
        const Foo = () => ({});

        expect(() => {
          world.entity().with(Foo)().build();
        }).toThrow('unknown Component');
      });
    });

    describe('delete', () => {
      it('should remove entity with all components', () => {
        const world = new World({});
        const Name = (name: string) => ({name});
        const Position = (x: number, y: number) => ({x, y});
        world.register(Name);
        world.register(Position);

        world.entity().with(Name)('Bob').with(Position)(1, 2).build();
        const entity1 = world.entity().with(Name)('Roger').build();
        world.entity().with(Name)('Tom').build();
        world.delete(entity1);

        expect(world.query(Name).collect()).toEqual([
          [{name: 'Bob'}],
          [{name: 'Tom'}],
        ]);
      });

      it('should fail gracefully for unknown entity', () => {
        const world = new World({});

        expect(() => {
          world.delete({generation: 99, index: 0});
        }).not.toThrow();
      });
    });
  });

  describe('Components', () => {
    const Name = (name: string) => ({name});
    const Position = (x: number, y: number) => ({x, y});
    const Velocity = (vx: number, vy: number) => ({vx, vy});
    const MyTag = createTag();
    let world: World;

    beforeEach(() => {
      world = new World({});
    });

    describe('register', () => {
      it('should allow utilization of component', () => {
        world.register(Name);

        world.entity().with(Name)('Bob').build();
      });
    });

    describe('get', () => {
      it('should retrieve component for entity', () => {
        world.register(Name);

        const entity = world.entity().with(Name)('Tom').build();
        const result = world.get(Name, entity);

        expect(result!.name).toEqual('Tom');
      });

      it('should return undefined for tag components', () => {
        world.register(MyTag);
        const entity = world.entity().with(MyTag)().build();

        expect(world.get(MyTag, entity)).toEqual(undefined);
      });

      it('should return undefined if entity doesn\'t have component', () => {
        world.register(Name);

        const entity = world.entity().build();
        const result = world.get(Name, entity);

        expect(result).toBeUndefined();
      });

      it('should throw for unregistered component', () => {
        const entity = world.entity().build();

        expect(() => {
          world.get(Name, entity);
        }).toThrow('unknown Component');
      });
    });

    describe('add', () => {
      it('should associate component with entity', () => {
        world.register(Name);

        const entity = world.entity().build();

        world.add(Name, entity)('Roger');
      });

      it('should override existing component', () => {
        world.register(Name);

        const entity = world.entity().with(Name)('Tom').build();
        world.add(Name, entity)('Bob');
        const result = world.get(Name, entity);

        expect(result!.name).toEqual('Bob');
      });

      it('should throw on unregistered component', () => {
        const entity = world.entity().build();

        expect(() => {
          world.add(Name, entity)('Bob');
        }).toThrow('unknown Component');
      });

      it('should throw on unknown entity', () => {
        expect(() => {
          world.add(Name, {generation: 99, index: 9})('Bob');
        }).toThrow('unknown entity');
      });
    });

    describe('remove', () => {
      it('should unassociate component with entity', () => {
        world.register(Name);
        world.register(Position);
        const entity0 = world
          .entity()
          .with(Name)('Bob')
          .with(Position)(1, 1)
          .build();
        const entity1 = world
          .entity()
          .with(Name)('Tom')
          .with(Position)(0, -1)
          .build();

        world.remove(Position, entity1);
        const name0 = world.get(Name, entity0);
        const pos0 = world.get(Position, entity0);
        const name1 = world.get(Name, entity1);
        const pos1 = world.get(Position, entity1);

        expect(name0!.name).toEqual('Bob');
        expect(pos0).toEqual({x: 1, y: 1});
        expect(name1!.name).toEqual('Tom');
        expect(pos1).toBeUndefined();
      });

      it('should throw on unregistered component', () => {
        world.entity().build();
        expect(() => {
          world.remove(Position, {generation: 1, index: 1});
        }).toThrow('unknown Component');
      });

      it('should throw on unknown entity', () => {
        world.register(Position);
        expect(() => {
          world.remove(Position, {generation: 1, index: 1});
        }).toThrow('unknown entity');
      });
    });

    describe('query', () => {
      let A: ComponentFactory;
      let B: ComponentFactory;

      beforeEach(() => {
        A = createTag();
        B = createTag();

        world.register(Name);
        world.register(Position);
        world.register(Velocity);
        world.register(A);
        world.register(B);
        world
          .entity()
          .with(Name)('Bob')
          .with(Position)(1, 2)
          .with(Velocity)(0, 2)
          .with(A)()
          .build();
        world.entity().with(Name)('Roger').with(Position)(0, -1).build();
        world
          .entity()
          .with(Name)('Tom')
          .with(Position)(-9, 3)
          .with(Velocity)(1, 1)
          .with(B)()
          .build();
      });

      it('should return components which match', () => {
        const result = world.query(Name, Position, Velocity).collect();

        expect(result).toEqual([
          [{name: 'Bob'}, {x: 1, y: 2}, {vx: 0, vy: 2}],
          [{name: 'Tom'}, {x: -9, y: 3}, {vx: 1, vy: 1}],
        ]);
      });

      it('should allow negative searches', () => {
        const result = world.query(Name).not(A).not(B).collect();

        expect(result).toEqual([[{name: 'Roger'}]]);
      });

      it('should return true for positive tag matches', () => {
        const result = world.query(A).collect();

        expect(result).toEqual([[true]]);
      });

      it('should return entities when requested', () => {
        const result = world.query(Position, Entity).collect();

        expect(result).toEqual([
          [
            {x: 1, y: 2},
            {generation: 1, index: 0},
          ],
          [
            {x: 0, y: -1},
            {generation: 1, index: 1},
          ],
          [
            {x: -9, y: 3},
            {generation: 1, index: 2},
          ],
        ]);
      });

      it('should throw given an unregister component', () => {
        expect(() => {
          const Foo = () => ({});
          world.query(Foo);
        }).toThrow('unknown Component');
      });

      it('should be iterable', () => {
        const result: string[] = [];

        for (const [name] of world.query(Name)) {
          result.push(name.name);
        }

        expect(result).toEqual(['Bob', 'Roger', 'Tom']);
      });

      it('should throw if #collect() called after iteration has started', () => {
        expect(() => {
          const query = world.query(Name);

          // eslint-disable-next-line no-unreachable-loop
          for (const _x of query) {
            break;
          }

          query.collect();
        }).toThrow('#collect()');
      });

      it('should throw if #not() called after iteration has started', () => {
        expect(() => {
          const query = world.query(Name);

          // eslint-disable-next-line no-unreachable-loop
          for (const _x of query) {
            break;
          }

          query.not(Velocity);
        }).toThrow('#not()');
      });
    });
  });

  describe('Systems', () => {
    it('should run systems in order they are added', () => {
      const world = new World({result: ''});

      world
        .system(w => {
          w.resources.result += 'a';
        })
        .system(w => {
          w.resources.result += 'b';
        });
      world.system(w => {
        w.resources.result += 'c';
      });

      world.update();
      expect(world.resources.result).toEqual('abc');

      world.update();
      expect(world.resources.result).toEqual('abcabc');
    });
  });
});
