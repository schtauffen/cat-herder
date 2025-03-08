export class IdentityPool implements IdentityPool {
  private _id = 0;
  private readonly _retired: number[] = [];

  get() {
    return this._retired.length > 0 ? this._retired.shift()! : this._id++;
  }

  retire(id: number) {
    this._retired.push(id);
  }
}
