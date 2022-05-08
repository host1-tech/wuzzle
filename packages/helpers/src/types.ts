export type MaybeArray<T> = T | T[];

export type MaybePromise<T> = T | Promise<T>;

export type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};
