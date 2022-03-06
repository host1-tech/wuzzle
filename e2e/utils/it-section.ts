import { bgRgb, rgb } from 'chalk';
import { logImmediately } from './log-immediately';

const bgBlueDark = bgRgb(0, 32, 128);
const bgRedDark = bgRgb(128, 0, 0);
const bgYellowDark = bgRgb(128, 128, 0);
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

function logSkipped(name: string) {
  logImmediately(bgYellowDark(' SKIPPED '), lightGrey(name));
  logImmediately();
}

interface ItSectionCall {
  <T>(name: string, fn: () => T): T;
}

interface ItSection extends ItSectionCall {
  skip: ItSectionCall;
}

const regularCall: ItSectionCall = (name, fn) => {
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
};

const skipCall: ItSectionCall = name => {
  logSkipped(name);
  return Promise.resolve() as never;
};

export const itSection: ItSection = Object.assign(regularCall, { skip: skipCall });
