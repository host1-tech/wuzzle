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

  const razzleRegisterPath = resolveRequire('../registers/razzle__3.x');
  process.env[EK_INTERNAL_PRE_CONFIG] = resolveRequire('../registers/razzle__3.x/pre-config');

  execNode({
    nodePath,
    args,
    execArgs: ['-r', razzleRegisterPath, razzleCommandPath, ...args],
  });
};
