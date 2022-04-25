import webpackMerge from 'webpack-merge';

export function wMerge<T extends object>(...objects: T[]): T {
  return webpackMerge({} as never, ...objects);
}
