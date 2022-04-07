import { logError, logPlain, resolveCommandPath, resolveCommandSemVer } from '@wuzzle/helpers';
import { EK_COMMAND_ARGS, EXIT_CODE_ERROR } from '../constants';
import {
  applyJestExtraOptions,
  doFileRegistering,
  execNode,
  LaunchFunction,
  tmplLogForGlobalResolving,
} from '../utils';

export const launchRazzle: LaunchFunction = ({ nodePath, args, projectPath, commandName }) => {
  const razzleSubCommand = JSON.parse(process.env[EK_COMMAND_ARGS]!)[0];
  if (razzleSubCommand === 'test') {
    applyJestExtraOptions({ nodePath, name: 'wuzzle-razzle-test', args });
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
  execNode({
    nodePath,
    execArgs: [razzleCommandPath, ...args],
  });
};
