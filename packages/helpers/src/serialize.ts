import { cloneDeep, forEach, isNative, isObjectLike } from 'lodash';
import serializeJavascript from 'serialize-javascript';

export function serialize(o: any): string {
  return serializeJavascript(prepareSerializable(o));
}

function prepareSerializable(o: any): any {
  return purifyNative(cloneDeep(o));
}

function purifyNative(o: any): any {
  if (isObjectLike(o)) {
    forEach(o, (v, k) => {
      o[k] = purifyNative(v);
    });
  }

  if (isNative(o)) {
    return purifiedNative;
  }

  return o;
}

export const purifiedNative = function native() {};
