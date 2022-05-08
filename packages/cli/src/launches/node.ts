import { resolveRequire } from '@wuzzle/helpers';
import { applyNodeLikeExtraOptions, execNode, LaunchFunction } from '../utils';

export const launchNode: LaunchFunction = async ({ nodePath, args }) => {
  await applyNodeLikeExtraOptions({ nodePath, name: 'wuzzle-node', args });

  const nodeRegisterPath = resolveRequire('../registers/node');

  execNode({
    nodePath,
    execArgs: ['-r', nodeRegisterPath, ...args],
  });
};
