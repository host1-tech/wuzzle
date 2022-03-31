import { cloneDeep, forEach, isObjectLike } from 'lodash';
import { inspect, InspectOptions } from 'util';

export type StringifyOptions = Partial<StringifyInternalOptions>;

export interface StringifyInternalOptions extends InspectOptions {
  overlongThreshold: number;
}

export const stringifyDefaultOptions: StringifyInternalOptions = {
  depth: Infinity,
  overlongThreshold: 10000,
};

export function stringify(o: any, options: StringifyOptions = {}): string {
  const internalOptions: StringifyInternalOptions = {
    ...stringifyDefaultOptions,
    ...options,
  };
  return inspect(prepareStringifiable(o, internalOptions), internalOptions);
}

function prepareStringifiable(o: any, options: StringifyInternalOptions): any {
  return reduceOverlong(cloneDeep(o), options);
}

function reduceOverlong(o: any, options: StringifyInternalOptions): any {
  if (isObjectLike(o)) {
    forEach(o, (v, k) => {
      o[k] = reduceOverlong(v, options);
    });
  }

  switch (typeof o) {
    case 'object':
      if (inspect(o, { ...options, depth: 0 }).length >= options.overlongThreshold) {
        return '...';
      }
      break;
    default:
      if (inspect(o, options).length >= options.overlongThreshold) {
        return '...';
      }
  }

  return o;
}
