# Cat Herder
An ECS ([Entity Component System](https://en.wikipedia.org/wiki/Entity_component_system)) implementation written in TypeScript.

```bash
npm i cat-herder
```

## Usage

```typescript
import { World, Entity } from 'cat-herder';

// Components are of form (...args: any) => Record<string, any>
const Name = (name: string) => ({ name });
const Velocity = (vx: number, vy: number) => ({ vx, vy });

const world = World();

world.register(Name);

// Entities
const bob = world.entity()
  .with(Name)("Bob")
  .build();
const roger = world.entity()
  .with(Name)("Roger")
  .with(Velocity)(0, 1)
  .build();

// Querying
for (const [name] of world.query(Name).result()) {
  console.log(name.name); // "Bob", "Roger"
}

for (const [name] of world.query(Name).not(Velocity).result()) {
  console.log(name.name); // "Bob"
}

for (const [name, velocity] of world.query(Name, Velocity).result()) {
  console.log(name.name); // "Roger"
  console.log(velocity); // { vx: 0, vy: 1 }
}
```

## Dependencies
For now, cat-herder bundles [BitSet](https://www.npmjs.com/package/bitset).

## Warning
This is a very early project and there will be many breaking changes.  
