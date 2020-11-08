interface IIdentityPool {
  get(): number;
  retire(id: number): void;
}

export function IdentityPool(): IIdentityPool {
  let id = 0;
  const retired: number[] = [];

  return {
    get() {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return retired.length > 0 ? retired.shift()! : id++;
    },

    retire(id: number) {
      retired.push(id);
    },
  };
}
