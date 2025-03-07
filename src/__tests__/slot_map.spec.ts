import { IKey, SlotMap } from "../slot_map";

describe("SlotMap", () => {
  it("should store items", () => {
    // Arrange
    const slot_map = SlotMap();
    const key1 = slot_map.add({ foo: "bar" });
    const key2 = slot_map.add({ biz: "baz" });

    // Act
    const result1 = slot_map.get(key1);
    const result2 = slot_map.get(key2);

    // Assert
    expect(key1.index).toEqual(0);
    expect(key1.generation).toEqual(1);
    expect(key2.index).toEqual(1);
    expect(key2.generation).toEqual(1);
    expect(result1).toEqual({ foo: "bar" });
    expect(result2).toEqual({ biz: "baz" });
  });

  it("should return undefined for removed item", () => {
    // Arrange
    const slot_map = SlotMap();
    const key = slot_map.add({ foo: "bar" });

    // Act
    slot_map.remove(key);
    const result = slot_map.get(key);

    // Assert
    expect(result).toBeUndefined();
  });

  it("should reuse indices", () => {
    // Arrange
    const slot_map = SlotMap<number>();
    const keys: IKey[] = [];
    for (let idx = 0; idx < 8; idx++) {
      keys[idx] = slot_map.add(idx);
    }

    // Act
    slot_map.remove(keys[1]);
    keys[8] = slot_map.add(8);
    const results: number[] = [];
    for (let idx = 0; idx < 9; ++idx) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      results[idx] = slot_map.get(keys[idx])!;
    }

    // Assert
    expect(keys).toEqual([
      { index: 0, generation: 1 },
      { index: 1, generation: 1 },
      { index: 2, generation: 1 },
      { index: 3, generation: 1 },
      { index: 4, generation: 1 },
      { index: 5, generation: 1 },
      { index: 6, generation: 1 },
      { index: 7, generation: 1 },
      { index: 1, generation: 2 },
    ]);
    expect(results).toEqual([0, undefined, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("should be iterable", () => {
    // Arrange
    const slot_map = SlotMap<string>();
    slot_map.add("foo");
    slot_map.add("bar");
    slot_map.add("biz");
    slot_map.add("baz");

    // Act
    const result = [...slot_map];

    // Assert
    expect(result).toEqual(["foo", "bar", "biz", "baz"]);
  });

  it("should allow items to be overwritten", () => {
    // Arrange
    const slot_map = SlotMap<string>();
    slot_map.add("foo");
    const key = slot_map.add("bar");
    slot_map.add("biz");

    // Act
    const success = slot_map.set(key, "baz");
    const result = [...slot_map];

    // ASsert
    expect(success).toBe(true);
    expect(result).toEqual(["foo", "baz", "biz"]);
  });

  it("should fail to set removed key", () => {
    // Arrange
    const slot_map = SlotMap<string>();
    slot_map.add("foo");
    const key = slot_map.add("bar");
    slot_map.add("biz");
    slot_map.remove(key);

    // Act
    const success = slot_map.set(key, "baz");
    const result = [...slot_map];

    // ASsert
    expect(success).toBe(false);
    expect(result).toEqual(["foo", "biz"]);
  });
});
