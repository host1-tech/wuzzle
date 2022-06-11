import { v4 as uuidv4 } from 'uuid';

import { transform } from '../node/transform';

export function getCacheKey() {
  return uuidv4();
}

export function process(code: string, file: string): string {
  return transform(code, file);
}
