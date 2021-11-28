import { bgRgb } from 'chalk';
import { logImmediately } from './log-immediately';

function logStart(name: string) {
  logImmediately(bgRgb(0, 64, 255)(' START '), name);
}

function logClose(name: string) {
  logImmediately(bgRgb(0, 32, 128)(' CLOSE '), name);
  logImmediately();
}

export function itSection<T>(name: string, fn: () => T): T {
  logStart(name);
  const result = fn();
  if (result instanceof Promise) {
    result.then(() => logClose(name));
  } else {
    logClose(name);
  }
  return result;
}
