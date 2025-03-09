import {describe, it, expect} from 'vitest';
import {type Key, SlotMap} from '../slot-map.js';

describe('SlotMap', () => {
  it('should store items', () => {
    // Arrange
    const slotMap = new SlotMap();
    const key1 = slotMap.add({foo: 'bar'});
    const key2 = slotMap.add({biz: 'baz'});

    // Act
    const result1 = slotMap.get(key1);
    const result2 = slotMap.get(key2);

    // Assert
    expect(key1.index).toEqual(0);
    expect(key1.generation).toEqual(1);
    expect(key2.index).toEqual(1);
    expect(key2.generation).toEqual(1);
    expect(result1).toEqual({foo: 'bar'});
    expect(result2).toEqual({biz: 'baz'});
  });

  it('should return undefined for removed item', () => {
    // Arrange
    const slotMap = new SlotMap();
    const key = slotMap.add({foo: 'bar'});

    // Act
    const results = [slotMap.remove(key), slotMap.get(key)];

    // Assert
    expect(results).toEqual([{foo: 'bar'}, undefined]);
  });

  it('should reuse indices', () => {
    // Arrange
    const slotMap = new SlotMap<number>();
    const keys: Key[] = [];
    for (let index = 0; index < 8; index++) {
      keys[index] = slotMap.add(index);
    }

    // Act
    slotMap.remove(keys[1]);
    keys[8] = slotMap.add(8);
    const results: number[] = [];
    for (let index = 0; index < 9; ++index) {
      results[index] = slotMap.get(keys[index])!;
    }

    // Assert
    expect(keys).toEqual([
      {index: 0, generation: 1},
      {index: 1, generation: 1},
      {index: 2, generation: 1},
      {index: 3, generation: 1},
      {index: 4, generation: 1},
      {index: 5, generation: 1},
      {index: 6, generation: 1},
      {index: 7, generation: 1},
      {index: 1, generation: 2},
    ]);
    expect(results).toEqual([0, undefined, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('should be iterable', () => {
    // Arrange
    const slotMap = new SlotMap<string>();
    slotMap.add('foo');
    slotMap.add('bar');
    slotMap.add('biz');
    slotMap.add('baz');

    // Act
    const result = [...slotMap];

    // Assert
    expect(result).toEqual(['foo', 'bar', 'biz', 'baz']);
  });

  describe('SlotMap#entries', () => {
    it('should be iterable', () => {
      // Arrange
      const slotMap = new SlotMap<string>();
      const keys = [
        slotMap.add('foo'),
        slotMap.add('bar'),
        slotMap.add('biz'),
        slotMap.add('baz'),
      ];
      slotMap.remove(keys[1]);
      slotMap.add('riz');
      slotMap.remove(keys[3]);

      // Act
      const result = Array.from(slotMap.entries());

      // Assert
      expect(result).toEqual([
        [{generation: 1, index: 0}, 'foo'],
        [{generation: 1, index: 2}, 'biz'],
        [{generation: 1, index: 4}, 'riz'],
      ]);
    });
  });

  it('should not iterate over removed items', () => {
    // Arrange
    const slotMap = new SlotMap<string>();
    slotMap.add('foo');
    const toRemove = slotMap.add('bar');
    slotMap.add('biz');
    slotMap.add('baz');
    slotMap.remove(toRemove);

    // Act
    const result = [...slotMap];

    // Assert
    expect(result).toEqual(['foo', 'baz', 'biz']);
  });

  it('should allow items to be overwritten', () => {
    // Arrange
    const slotMap = new SlotMap<string>();
    slotMap.add('foo');
    const key = slotMap.add('bar');
    slotMap.add('biz');

    // Act
    const success = slotMap.set(key, 'baz');
    const result = [...slotMap];

    // ASsert
    expect(success).toBe(true);
    expect(result).toEqual(['foo', 'baz', 'biz']);
  });

  it('should fail to set removed key', () => {
    // Arrange
    const slotMap = new SlotMap<string>();
    slotMap.add('foo');
    const key = slotMap.add('bar');
    slotMap.add('biz');
    slotMap.remove(key);

    // Act
    const success = slotMap.set(key, 'baz');
    const result = [...slotMap];

    // ASsert
    expect(success).toBe(false);
    expect(result).toEqual(['foo', 'biz']);
  });
});
