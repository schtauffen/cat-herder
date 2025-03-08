/* eslint-disable @typescript-eslint/no-non-null-assertion */
// https://eloquentjavascript.net/1st_edition/appendix2.html
// We aren't making it generic in order to get the most performance
export class BinaryNumberHeap {
  content: number[] = [];

  push(value: number) {
    this.content.push(value);
    this.bubbleUp(this.content.length - 1);
  }

  pop(): number | undefined {
    const result = this.content[0];
    const end = this.content.pop()!;

    if (this.content.length > 0) {
      this.content[0] = end;
      this.sinkDown(0);
    }

    return result;
  }

  remove(value: number) {
    const length = this.content.length;

    for (let i = 0; i < length; ++i) {
      if (this.content[i] !== value) {
        continue;
      }

      const end = this.content.pop()!;
      if (i === length - 1) {
        break;
      }

      this.content[i] = end;
      this.bubbleUp(i);
      this.sinkDown(i);
      break;
    }
  }

  size(): number {
    return this.content.length;
  }

  private bubbleUp(index: number) {
    const element = this.content[index];

    while (index > 0) {
      const parentN = (((index + 1) / 2) | 0) - 1;
      const parent = this.content[parentN];
      if (element >= parent) {
        break;
      }

      this.content[parentN] = element;
      this.content[index] = parent;
      index = parentN;
    }
  }

  private sinkDown(index: number) {
    const length = this.content.length;
    const element = this.content[index];

    while (true) {
      const child2N = (index + 1) * 2;
      const child1N = child2N - 1;
      let swap: number | null = null;

      if (child1N < length) {
        const child1 = this.content[child1N];
        if (child1 < element) {
          swap = child1N;
        }
      }

      if (child2N < length) {
        const child2 = this.content[child2N];
        if (child2 < (swap === null ? element : this.content[child1N])) {
          swap = child2N;
        }
      }

      if (swap === null) {
        break;
      }

      this.content[index] = this.content[swap];
      this.content[swap] = element;
      index = swap;
    }
  }
}
