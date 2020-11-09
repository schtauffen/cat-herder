# Cat Herder
An ECS ([Entity Component System](https://en.wikipedia.org/wiki/Entity_component_system)) implementation written in TypeScript.

```bash
npm i cat-herder
```

## Usage

```typescript
import { World, Entity } from 'cat-herder';

// Component factories are of form (...args: any) => Record<string, any>
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

## Entities
### entity 
Creates an entity with attached components.
```ts
const bob = world
  .entity()
  .with(Name)("Bob")
  .with(Position)(10, 10)
  .with(Velocity)(1, 2)
  .build();
```
### delete
Removes entity and any attached components.
```ts
world.delete(bob);
```
## Components
### register
Makes component available to attach to entities.  
Component factories must have form `(...args: any) => Record<string, any>`  
Attempting to attach an unregistered component will throw an error.  
Support for class-based components is on the roadmap.  
```ts
const Name = (name: string) => ({ name });

world.register(Name);

world
  .entity()
  .with(Name)("Bob") // will give appropriate type hints with TS
  .build();
```
### add
Attaches component to entity.
Attempting to attach an unregistered component will throw an error.  
Attempting to attach to an unknown entity will throw an error.  
```ts
const myEntity = world.entity().build();

myEntity.add(Name, myEntity)("Roger");
```
### get
Returns given component for entity. Will return null if not found.  
Attempting to retrieve an unregistered component will throw an error.  
Attempting to retrieve from an unknown entity will throw an error.  
```ts
world.get(Name, myEntity);
```
### remove
Removes component from entity.  
Attempting to remove an unregistered component will throw an error.  
Attempting to remove from an unknown entity will throw an error.  
```ts
world.remove(Name, myEntity);
```
### query
Returns results for all entities with matching components.  
Will exclude any entities with components in the `not` clause.  
You can retrieve entity by using the `Entity` component.  
```ts
import { Entity, World } from 'cat-herder';

const Name = (name: string) => ({ name });
const Position = (vx: number, vy: number) => ({ vx, vy });
const Dead = () => ({}); // Tag component (doesn't contain any actual data)

const world = World();
const mario = world
  .entity()
  .with(Name)("Mario")
  .with(Position)(10, 10)
  .build();
const luigi = world
  .entity()
  .with(Name)("Luigi")
  .with(Position)(5, 10)
  .build();
const Toad = world
  .entity()
  .with(Name)("Toad")
  .with(Position)(15, 10)
  .build();

// oops, Luigi had an accident
world.add(Dead, luigi);

for (const [entity, name, pos] of world.query(Entity, Name, Position).not(Dead).result()) {
  // Contains valid type hints in TS
  console.log(name.name); // Mario ; Toad
  console.log(`${pos.x}, ${pos.y}`); // 10, 10 ; 15 , 10
}
```
## Systems
### system
TODO
### tick
TODO
## Resources
### resource
TODO
### tick
TODO

## Dependencies
For now, cat-herder bundles [BitSet](https://www.npmjs.com/package/bitset).

## Warning
This is a very early project and there will be many breaking changes.  
