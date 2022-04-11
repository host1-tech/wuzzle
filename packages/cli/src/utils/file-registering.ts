import { logError, logPlain, resolveRequire } from '@wuzzle/helpers';
import { yellow } from 'chalk';
import { EK_INTERNAL_PRE_CONFIG, EXIT_CODE_ERROR } from '../constants';
import { RegisterOptions } from './register-unregister';

/**
 * The default maximum umber of attempts for doing file registering.
 */
export const FILE_REGISTERING_DEFAULT_ATTEMPTS = 2;

export interface FileRegisteringOptions extends RegisterOptions {
  registerName: string;
  majorVersion: number;
  attempts?: 1 | 2 | 3;
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
        process.env[EK_INTERNAL_PRE_CONFIG] = preConfigPath;
      } catch {}

      if (i > 0) {
        logPlain(
          yellow(
            `Did registering on ${registerName}@${majorVersion}.x ` +
              `with register for ${registerName}@${attemptingMajorVersion}.x.`
          )
        );
      }
      return;
    } catch (e) {
      error = e;
    }
  }
  logError(`error: failed to do registering on ${registerName}@${majorVersion}.x`);
  logError(error);
  process.exit(EXIT_CODE_ERROR);
}
