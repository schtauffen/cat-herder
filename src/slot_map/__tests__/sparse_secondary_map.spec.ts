import { SlotMap } from "../slot_map";
import { SparseSecondaryMap } from "../sparse_secondary_map";

describe("SparseSecondaryMap", () => {
  it("should allow setting and getting of key, value pairs", () => {
    // Arrange
    const slot_map = SlotMap<number>();
    const key_1 = slot_map.add(1);
    const key_2 = slot_map.add(2);
    const secondary = new SparseSecondaryMap<string>();

    // Act
    secondary.set(key_1, "one");
    const results = [secondary.get(key_1), secondary.get(key_2)];

    // Assert
    expect(results).toEqual(["one", undefined]);
  });

  it("SparseSecondaryMap#has should return if key is occupied", () => {
    // Arrange
    const slot_map = SlotMap<number>();
    const key_1 = slot_map.add(1);
    const key_2 = slot_map.add(2);
    const secondary = new SparseSecondaryMap<string>();
    secondary.set(key_1, "one");

    // Act
    const results = [secondary.has(key_1), secondary.has(key_2)];

    // Assert
    expect(results).toEqual([true, false]);
  });

  it("should allow for removals", () => {
    // Arrange
    const slot_map = SlotMap<number>();
    const key = slot_map.add(1);
    const secondary = new SparseSecondaryMap<string>();
    secondary.set(key, "foo");

    // Act
    secondary.remove(key);
    const results = [secondary.has(key), secondary.get(key)];

    // Assert
    expect(results).toEqual([false, undefined]);
  });

  it("should be iterable", () => {
    // Arrange
    const slot_map = SlotMap<string>();
    const keys = [
      slot_map.add("foo"),
      slot_map.add("bar"),
      slot_map.add("biz"),
      slot_map.add("baz"),
      slot_map.add("riz"),
    ];
    const secondary = new SparseSecondaryMap<string>();
    keys.forEach((k) => {
      secondary.set(k, slot_map.get(k)?.toUpperCase() || "null");
    });
    secondary.remove(keys[1]);
    secondary.remove(keys[3]);

    // Act
    const results = [secondary.size(), Array.from(secondary)];

    // Assert
    expect(results).toEqual([3, ["FOO", "BIZ", "RIZ"]]);
  });
});
