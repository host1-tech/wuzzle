import { yellow } from 'chalk';

import { logError, logPlain, resolveRequire } from '@wuzzle/helpers';

import { EK, EXIT_CODE_ERROR } from '../constants';
import { envSet } from './env-get-set';
import { RegisterOptions } from './register-unregister';

/**
 * The default maximum umber of attempts for doing file registering.
 */
export const FILE_REGISTERING_DEFAULT_ATTEMPTS = 2;

export interface FileRegisteringOptions extends RegisterOptions {
  registerName: string;
  majorVersion: number;
  attempts?: 1 | 2 | 3;
  throwErr?: boolean;
}

/**
 * Target a register function under 'src/registers' in terms of 'registerName' and 'majorVersion',
 * then invoke the register. If an attempt fails and it doesn't reach the maximum number of
 * 'attemps', another attempt will get issued on a smaller neighbor major version. If an attempt
 * succeeds, the function exits normally. If all attempts fail, the current process gets terminated
 * with errors logged.
 */
export function doFileRegistering({
  registerName,
  majorVersion,
  attempts = FILE_REGISTERING_DEFAULT_ATTEMPTS,
  throwErr,
  ...registerOptions
}: FileRegisteringOptions): void {
  let error: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const attemptingMajorVersion = majorVersion - i;

      const registerPath = resolveRequire(
        `../registers/${registerName}__${attemptingMajorVersion}.x`
      );
      require(registerPath).register(registerOptions);

      try {
        const preConfigPath = resolveRequire(
          `../registers/${registerName}__${attemptingMajorVersion}.x/pre-config`
        );
        envSet(EK.INTERNAL_PRE_CONFIG, preConfigPath);
      } catch {}

      if (i > 0) {
        logPlain(
          yellow(
            `Registered for '${registerName}@${majorVersion}.x' ` +
              `with the register for '${registerName}@${attemptingMajorVersion}.x'.`
          )
        );
      }
      return;
    } catch (e) {
      error = e;
    }
  }

  if (throwErr) {
    throw new Error(`Failed to register for '${registerName}@${majorVersion}.x'`);
  } else {
    logError(`error: failed to register for '${registerName}@${majorVersion}.x'.`);
    logError(error);
    process.exit(EXIT_CODE_ERROR);
  }
}
