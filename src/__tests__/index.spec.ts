/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Entity, World, IWorld, ComponentFactory } from "../index";

describe("Entity", () => {
  it("should throw error", () => {
    expect(() => {
      Entity();
    }).toThrowError("World#entity()");
  });
});

describe("World", () => {
  it("should create", () => {
    expect(World({})).toBeTruthy();
  });

  describe("Entities", () => {
    describe("entity", () => {
      it("should return entity builder", () => {
        const world = World({});

        const entity0 = world.entity().build();
        const entity1 = world.entity().build();

        expect(entity0).toBe(0);
        expect(entity1).toBe(1);
      });

      it("should throw when given unregistered component", () => {
        const world = World({});
        const Foo = () => ({});

        expect(() => {
          world.entity().with(Foo)().build();
        }).toThrowError("unknown Component");
      });
    });

    describe("delete", () => {
      it("should remove entity with all components", () => {
        const world = World({});
        const Name = (name: string) => ({ name });
        const Position = (x: number, y: number) => ({ x, y });
        world.register(Name);
        world.register(Position);

        world.entity().with(Name)("Bob").with(Position)(1, 2).build();
        const entity1 = world.entity().with(Name)("Roger").build();
        world.entity().with(Name)("Tom").build();
        world.delete(entity1);

        expect(world.entity().build()).toEqual(entity1);
        expect(world.query(Name).result()).toEqual([
          [{ name: "Bob" }],
          [{ name: "Tom" }],
        ]);
      });

      it("should fail gracefully for unknown entity", () => {
        const world = World({});

        expect(() => {
          world.delete(0);
        }).not.toThrow();
      });
    });
  });

  describe("Components", () => {
    const Name = (name: string) => ({ name });
    const Position = (x: number, y: number) => ({ x, y });
    const Velocity = (vx: number, vy: number) => ({ vx, vy });
    let world: IWorld;

    beforeEach(() => {
      world = World({});
    });

    describe("register", () => {
      it("should allow utilization of component", () => {
        world.register(Name);

        world.entity().with(Name)("Bob").build();
      });
    });

    describe("get", () => {
      it("should retrieve component for entity", () => {
        world.register(Name);

        const entity = world.entity().with(Name)("Tom").build();
        const result = world.get(Name, entity);

        expect(result!.name).toEqual("Tom");
      });

      it("should return null if entity doesn't have component", () => {
        world.register(Name);

        const entity = world.entity().build();
        const result = world.get(Name, entity);

        expect(result).toBeNull();
      });

      it("should throw for unregistered component", () => {
        const entity = world.entity().build();

        expect(() => {
          world.get(Name, entity);
        }).toThrowError("unknown Component");
      });
    });

    describe("add", () => {
      it("should associate component with entity", () => {
        world.register(Name);

        const entity = world.entity().build();

        world.add(Name, entity)("Roger");
      });

      it("should override existing component", () => {
        world.register(Name);

        const entity = world.entity().with(Name)("Tom").build();
        world.add(Name, entity)("Bob");
        const result = world.get(Name, entity);

        expect(result!.name).toEqual("Bob");
      });

      it("should throw on unregistered component", () => {
        const entity = world.entity().build();

        expect(() => {
          world.add(Name, entity)("Bob");
        }).toThrowError("unknown Component");
      });

      it("should throw on unknown entity", () => {
        expect(() => {
          world.add(Name, 77)("Bob");
        }).toThrowError("unknown entity");
      });
    });

    describe("remove", () => {
      it("should unassociate component with entity", () => {
        world.register(Name);
        world.register(Position);
        const entity0 = world
          .entity()
          .with(Name)("Bob")
          .with(Position)(1, 1)
          .build();
        const entity1 = world
          .entity()
          .with(Name)("Tom")
          .with(Position)(0, -1)
          .build();

        world.remove(Position, entity1);
        const name0 = world.get(Name, entity0);
        const pos0 = world.get(Position, entity0);
        const name1 = world.get(Name, entity1);
        const pos1 = world.get(Position, entity1);

        expect(name0!.name).toEqual("Bob");
        expect(pos0).toEqual({ x: 1, y: 1 });
        expect(name1!.name).toEqual("Tom");
        expect(pos1).toEqual(null);
      });

      it("should throw on unregistered component", () => {
        world.entity().build();
        expect(() => {
          world.remove(Position, 0);
        }).toThrowError("unknown Component");
      });

      it("should throw on unknown entity", () => {
        world.register(Position);
        expect(() => {
          world.remove(Position, 0);
        }).toThrowError("unknown entity");
      });
    });

    describe("query_iter", () => {
      let A: ComponentFactory;
      let B: ComponentFactory;

      beforeEach(() => {
        A = () => ({});
        B = () => ({});

        world.register(Name);
        world.register(Position);
        world.register(Velocity);
        world.register(A);
        world.register(B);
        world
          .entity()
          .with(Name)("Bob")
          .with(Position)(1, 2)
          .with(Velocity)(0, 2)
          .with(A)()
          .build();
        world.entity().with(Name)("Roger").with(Position)(0, -1).build();
        world
          .entity()
          .with(Name)("Tom")
          .with(Position)(-9, 3)
          .with(Velocity)(1, 1)
          .with(B)()
          .build();
      });

      it("should return components which match", () => {
        const result = world.query_iter(Name, Position, Velocity).collect();

        expect(result).toEqual([
          [{ name: "Bob" }, { x: 1, y: 2 }, { vx: 0, vy: 2 }],
          [{ name: "Tom" }, { x: -9, y: 3 }, { vx: 1, vy: 1 }],
        ]);
      });

      it("should allow negative searches", () => {
        const result = world.query_iter(Name).not(A).not(B).collect();

        expect(result).toEqual([[{ name: "Roger" }]]);
      });

      it("should return entities when requested", () => {
        const result = world.query_iter(Position, Entity).collect();

        expect(result).toEqual([
          [{ x: 1, y: 2 }, 0],
          [{ x: 0, y: -1 }, 1],
          [{ x: -9, y: 3 }, 2],
        ]);
      });

      it("should throw given an unregister component", () => {
        expect(() => {
          const Foo = () => ({});
          world.query_iter(Foo);
        }).toThrowError("unknown Component");
      });

      it("should be iterable", () => {
        const result: string[] = [];

        for (const [name] of world.query_iter(Name)) {
          result.push(name.name);
        }

        expect(result).toEqual(["Bob", "Roger", "Tom"]);
      });

      it("should throw if #collect() called after iteration has started", () => {
        expect(() => {
          const query = world.query_iter(Name);
          for (const [] of query) {
            break;
          }
          query.collect();
        }).toThrowError("#collect()");
      });

      it("should throw if #not() called after iteration has started", () => {
        expect(() => {
          const query = world.query_iter(Name);
          for (const [] of query) {
            break;
          }
          query.not(Velocity);
        }).toThrowError("#not()");
      });
    });

    describe("query", () => {
      beforeEach(() => {
        world.register(Name);
        world.register(Position);
        world.register(Velocity);
        world
          .entity()
          .with(Name)("Bob")
          .with(Position)(1, 2)
          .with(Velocity)(0, 2)
          .build();
        world.entity().with(Name)("Roger").with(Position)(0, -1).build();
        world
          .entity()
          .with(Name)("Tom")
          .with(Position)(-9, 3)
          .with(Velocity)(1, 1)
          .build();
      });

      it("should return components which match", () => {
        const result = world.query(Name, Position, Velocity).result();

        expect(result).toEqual([
          [{ name: "Bob" }, { x: 1, y: 2 }, { vx: 0, vy: 2 }],
          [{ name: "Tom" }, { x: -9, y: 3 }, { vx: 1, vy: 1 }],
        ]);
      });

      it("should allow negative searches", () => {
        const result = world.query(Name).not(Velocity).result();

        expect(result).toEqual([[{ name: "Roger" }]]);
      });

      it("should return entities when requested", () => {
        const result = world.query(Position, Entity).result();

        expect(result).toEqual([
          [{ x: 1, y: 2 }, 0],
          [{ x: 0, y: -1 }, 1],
          [{ x: -9, y: 3 }, 2],
        ]);
      });

      it("should throw given an unregister component", () => {
        expect(() => {
          const Foo = () => ({});
          world.query(Foo);
        }).toThrowError("unknown Component");
      });
    });
  });

  describe("Systems", () => {
    it("should run systems in order they are added", () => {
      const world = World({ result: "" });

      world
        .system((w) => {
          w.resources.result += "a";
        })
        .system((w) => {
          w.resources.result += "b";
        });
      world.system((w) => {
        w.resources.result += "c";
      });

      world.update();
      expect(world.resources.result).toEqual("abc");

      world.update();
      expect(world.resources.result).toEqual("abcabc");
    });
  });
});
