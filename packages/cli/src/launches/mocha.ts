import { resolveCommandPath, resolveRequire } from '@wuzzle/helpers';
import { EK_INTERNAL_PRE_CONFIG, EXIT_CODE_ERROR } from '../constants';
import { applyNodeLikeExtraOptions, execNode, LaunchFunction } from '../utils';

export const launchMocha: LaunchFunction = ({ nodePath, args, projectPath, commandName }) => {
  let mochaCommandPath: string;
  try {
    mochaCommandPath = resolveCommandPath({ cwd: projectPath, commandName });
  } catch {
    console.error(`error: failed to resolve command '${commandName}'.`);
    process.exit(EXIT_CODE_ERROR);
  }

  applyNodeLikeExtraOptions({ nodePath, name: 'wuzzle-mocha', args });

  const nodeRegisterPath = resolveRequire('../registers/node');
  process.env[EK_INTERNAL_PRE_CONFIG] = resolveRequire('../registers/node/pre-config');

  execNode({
    nodePath,
    args,
    execArgs: [mochaCommandPath, '-r', nodeRegisterPath, ...args],
  });
};
