import { bgRgb, rgb } from 'chalk';

import { logImmediately } from './log-immediately';

const bgRedBlack = bgRgb(64, 0, 0);
const redBlack = rgb(192, 0, 0);

/**
 * Expects exitCode to be 0. Prints errorMessages if it's not.
 */
export function expectExecSuccess(exitCode: number, ...errorMessages: string[]): void {
  if (exitCode !== 0) {
    logImmediately(
      bgRedBlack(' EXEC FAILURE '),
      redBlack(`[${expect.getState().currentTestName}]`),
      ...errorMessages
    );
  }
  expect(exitCode).toBe(0);
}
