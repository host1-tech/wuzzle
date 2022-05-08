import { logError, logPlain, resolveCommandPath, resolveRequire } from '@wuzzle/helpers';
import { EXIT_CODE_ERROR } from '../constants';
import {
  applyNodeLikeExtraOptions,
  execNode,
  LaunchFunction,
  tmplLogForGlobalResolving,
} from '../utils';

export const launchMocha: LaunchFunction = async ({ nodePath, args, projectPath, commandName }) => {
  let mochaCommandPath: string;
  try {
    try {
      mochaCommandPath = resolveCommandPath({ cwd: projectPath, commandName });
    } catch {
      mochaCommandPath = resolveCommandPath({ cwd: projectPath, commandName, fromGlobals: true });
      logPlain(tmplLogForGlobalResolving({ commandName, commandPath: mochaCommandPath }));
    }
  } catch {
    logError(`error: failed to resolve command '${commandName}'.`);
    process.exit(EXIT_CODE_ERROR);
  }

  await applyNodeLikeExtraOptions({ nodePath, name: 'wuzzle-mocha', args });

  const nodeRegisterPath = resolveRequire('../registers/node');

  execNode({
    nodePath,
    execArgs: [mochaCommandPath, '-r', nodeRegisterPath, ...args],
  });
};
