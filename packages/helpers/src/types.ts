export type MaybeArray<T> = T | T[];

export type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};
