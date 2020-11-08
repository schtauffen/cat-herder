import { IdentityPool } from "../identity";

describe("IdentityPool", () => {
  it("should return pool", () => {
    const pool = IdentityPool();
    expect(pool.get()).toEqual(0);
    expect(pool.get()).toEqual(1);
    expect(pool.get()).toEqual(2);
  });

  it("should reuse retired ids FIFO", () => {
    const pool = IdentityPool();
    for (let i = 0; i < 10; ++i) {
      pool.get();
    }

    pool.retire(6);
    pool.retire(0);

    expect(pool.get()).toEqual(6);
    pool.retire(7);
    expect(pool.get()).toEqual(0);
    expect(pool.get()).toEqual(7);
    expect(pool.get()).toEqual(10);
  });
});
