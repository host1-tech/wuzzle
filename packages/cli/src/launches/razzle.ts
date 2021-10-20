import { resolveCommandPath, resolveRequire } from '@wuzzle/helpers';
import { EK_INTERNAL_PRE_CONFIG, EXIT_CODE_ERROR } from '../constants';
import { execNode, LaunchFunction } from '../utils';

export const launchRazzle: LaunchFunction = ({ nodePath, args, projectPath, commandName }) => {
  let razzleCommandPath: string;
  try {
    razzleCommandPath = resolveCommandPath({ cwd: projectPath, commandName });
  } catch {
    console.error(`error: failed to resolve command '${commandName}'.`);
    process.exit(EXIT_CODE_ERROR);
  }

  process.env[EK_INTERNAL_PRE_CONFIG] = resolveRequire('../registers/razzle__3.x/pre-config');
  require('../registers/razzle__3.x').register({
    commandPath: razzleCommandPath,
  });

  execNode({
    nodePath,
    args,
    execArgs: [razzleCommandPath, ...args],
  });
};
