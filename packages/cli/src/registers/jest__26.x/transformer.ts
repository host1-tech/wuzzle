import { transform } from '../node/transform';
import { v4 as uuidv4 } from 'uuid';

export function getCacheKey() {
  return uuidv4();
}

export function process(code: string, file: string): string {
  // TODO resolve errors
  return transform(code, file);
}
