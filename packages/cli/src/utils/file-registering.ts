import { logError, logPlain, resolveRequire } from '@wuzzle/helpers';
import { yellow } from 'chalk';
import { EK_INTERNAL_PRE_CONFIG, EXIT_CODE_ERROR } from '../constants';
import { RegisterOptions } from './register-unregister';

/**
 * The number of times to try a file registering. The first try is done with the specified major
 * version. If a try fails, the next try is done with a smaller neighbor major version. If a try
 * succeeds, the function exits. If all tries fail, the process gets terminated with an error log.
 *
 * Taking an example of value 2, the first try is done with the specified major version. And if
 * the first try fails, the second try will get triggered with a smaller neighbor major version.
 * There is no third try, though. If all tries fail or one try succeeds, it will comes to the end.
 */
export const FILE_REGISTERING_TRIES = 2;

export interface FileRegisteringOptions extends RegisterOptions {
  registerName: string;
  majorVersion: number;
}

export function doFileRegistering({
  registerName,
  majorVersion,
  ...registerOptions
}: FileRegisteringOptions): void {
  for (let i = 0; i < FILE_REGISTERING_TRIES; i++) {
    try {
      const tryingMajorVersion = majorVersion - i;

      const registerPath = resolveRequire(`../registers/${registerName}__${tryingMajorVersion}.x`);
      require(registerPath).register(registerOptions);

      try {
        const preConfigPath = resolveRequire(
          `../registers/${registerName}__${tryingMajorVersion}.x/pre-config`
        );
        process.env[EK_INTERNAL_PRE_CONFIG] = preConfigPath;
      } catch {}

      if (i > 0) {
        logPlain(
          yellow(
            `Did registering on ${registerName} ${majorVersion} ` +
              `with register for ${registerName} ${tryingMajorVersion}.`
          )
        );
      }
      return;
    } catch {}
  }
  logError(`error: failed to do registering on ${registerName} ${majorVersion}`);
  process.exit(EXIT_CODE_ERROR);
}
