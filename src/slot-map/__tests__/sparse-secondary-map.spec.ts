import {describe, it, expect} from 'vitest';
import {SlotMap} from '../slot-map.js';
import {SparseSecondaryMap} from '../sparse-secondary-map.js';

describe('SparseSecondaryMap', () => {
  it('should allow setting and getting of key, value pairs', () => {
    // Arrange
    const slotMap = new SlotMap<number>();
    const key1 = slotMap.add(1);
    const key2 = slotMap.add(2);
    const secondary = new SparseSecondaryMap<string>();

    // Act
    secondary.set(key1, 'one');
    const results = [secondary.get(key1), secondary.get(key2)];

    // Assert
    expect(results).toEqual(['one', undefined]);
  });

  it('SparseSecondaryMap#has should return if key is occupied', () => {
    // Arrange
    const slotMap = new SlotMap<number>();
    const key1 = slotMap.add(1);
    const key2 = slotMap.add(2);
    const secondary = new SparseSecondaryMap<string>();
    secondary.set(key1, 'one');

    // Act
    const results = [secondary.has(key1), secondary.has(key2)];

    // Assert
    expect(results).toEqual([true, false]);
  });

  it('should allow for removals', () => {
    // Arrange
    const slotMap = new SlotMap<number>();
    const key = slotMap.add(1);
    const secondary = new SparseSecondaryMap<string>();
    secondary.set(key, 'foo');

    // Act
    secondary.remove(key);
    const results = [secondary.has(key), secondary.get(key)];

    // Assert
    expect(results).toEqual([false, undefined]);
  });

  it('should be iterable', () => {
    // Arrange
    const slotMap = new SlotMap<string>();
    const keys = [
      slotMap.add('foo'),
      slotMap.add('bar'),
      slotMap.add('biz'),
      slotMap.add('baz'),
      slotMap.add('riz'),
    ];
    const secondary = new SparseSecondaryMap<string>();
    for (const k of keys) {
      secondary.set(k, slotMap.get(k)?.toUpperCase() ?? 'undefined');
    }

    secondary.remove(keys[1]);
    secondary.remove(keys[3]);

    // Act
    const results = [secondary.size(), Array.from(secondary)];

    // Assert
    expect(results).toEqual([3, ['FOO', 'BIZ', 'RIZ']]);
  });
});
