/* eslint-disable @typescript-eslint/no-explicit-any */
// source: https://medium.com/free-code-camp/typescript-curry-ramda-types-f747e99744ab
export type Length<T extends any[]> = T["length"];

export type Cast<X, Y> = X extends Y ? X : Y;

export type Prepend<E, T extends any[]> = ((
  head: E,
  ...args: T
) => any) extends (...args: infer U) => any
  ? U
  : T;

export type Pos<I extends any[]> = Length<I>;

export type Next<I extends any[]> = Prepend<any, I>;

export type Reverse<
  T extends any[],
  R extends any[] = [],
  I extends any[] = []
> = {
  0: Reverse<T, Prepend<T[Pos<I>], R>, Next<I>>;
  1: R;
}[Pos<I> extends Length<T> ? 1 : 0];
