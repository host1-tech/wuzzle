import { bgRgb, rgb } from 'chalk';
import { logImmediately } from './log-immediately';

const bgBlueDark = bgRgb(0, 32, 128);
const bgRedDark = bgRgb(128, 0, 0);
const lightGrey = rgb(128, 128, 128);

function logStart(name: string) {
  logImmediately(bgBlueDark(' START '), lightGrey(name));
}

function logClose(name: string) {
  logImmediately(bgBlueDark(' CLOSE '), lightGrey(name));
  logImmediately();
}

function logError(name: string) {
  logImmediately(bgRedDark(' ERROR '), lightGrey(name));
  logImmediately();
}

export function itSection<T>(name: string, fn: () => T): T {
  logStart(name);
  try {
    const result = fn();
    if (result instanceof Promise) {
      result
        .then(() => logClose(name))
        .catch(err => {
          logError(name);
          throw err;
        });
    } else {
      logClose(name);
    }
    return result;
  } catch (err) {
    logError(name);
    throw err;
  }
}
