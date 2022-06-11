import {
  logError,
  logPlain,
  resolveCommandPath,
  resolveCommandSemVer,
  SimpleAsyncCall,
} from '@wuzzle/helpers';

import { EK, EXIT_CODE_ERROR } from '../constants';
import {
  applyJestExtraOptions,
  doFileRegistering,
  envGet,
  execNode,
  LaunchFunction,
  tmplLogForGlobalResolving,
} from '../utils';

export const launchRazzle: LaunchFunction = async ({
  nodePath,
  args,
  projectPath,
  commandName,
}) => {
  const razzleSubCommand = envGet(EK.COMMAND_ARGS)[0];
  const optInCalls: SimpleAsyncCall[] = [];

  if (razzleSubCommand === 'test') {
    const { applyPreCompilation } = applyJestExtraOptions({
      nodePath,
      name: 'wuzzle-razzle-test',
      args,
    });
    optInCalls.push(applyPreCompilation);
  }

  let razzleCommandPath: string;
  let razzleMajorVersion: number;
  try {
    try {
      razzleCommandPath = resolveCommandPath({ cwd: projectPath, commandName });
    } catch {
      razzleCommandPath = resolveCommandPath({ cwd: projectPath, commandName, fromGlobals: true });
      logPlain(tmplLogForGlobalResolving({ commandName, commandPath: razzleCommandPath }));
    }
    razzleMajorVersion = resolveCommandSemVer(razzleCommandPath).major;
  } catch {
    logError(`error: failed to resolve command '${commandName}'.`);
    process.exit(EXIT_CODE_ERROR);
  }

  doFileRegistering({
    registerName: 'razzle',
    majorVersion: razzleMajorVersion,
    commandPath: razzleCommandPath,
  });

  for (const call of optInCalls) await call();

  execNode({
    nodePath,
    execArgs: [razzleCommandPath, ...args],
  });
};
