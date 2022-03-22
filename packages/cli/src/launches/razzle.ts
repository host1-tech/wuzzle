import {
  logError,
  logPlain,
  resolveCommandPath,
  resolveCommandSemVer,
  resolveRequire,
} from '@wuzzle/helpers';
import { EK_COMMAND_ARGS, EK_INTERNAL_PRE_CONFIG, EXIT_CODE_ERROR } from '../constants';
import {
  applyJestExtraOptions,
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

  process.env[EK_INTERNAL_PRE_CONFIG] = resolveRequire(
    `../registers/razzle__${razzleMajorVersion}.x/pre-config`
  );

  require(`../registers/razzle__${razzleMajorVersion}.x`).register({
    commandPath: razzleCommandPath,
  });

  execNode({
    nodePath,
    args,
    execArgs: [razzleCommandPath, ...args],
  });
};
