export class IdentityPool implements IdentityPool {
  readonly #retired: number[] = [];
  #id = 0;

  get() {
    return this.#retired.length > 0 ? this.#retired.shift()! : this.#id++;
  }

  retire(id: number) {
    this.#retired.push(id);
  }
}
