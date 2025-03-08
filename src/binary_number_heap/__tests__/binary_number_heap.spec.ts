/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { BinaryNumberHeap } from "../binary_number_heap";

describe("BinaryNumberHeap", () => {
  it("should store numbers in order", () => {
    const heap = new BinaryNumberHeap();
    [10, 3, 4, 8, 2, 9, 7, 1, 2, 6, 3, 5].forEach((x) => {
      heap.push(x);
    });

    heap.remove(2);

    const result: number[] = [];

    while (heap.size() > 0) {
      result.push(heap.pop()!);
    }

    expect(result).toEqual([1, 2, 3, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});
