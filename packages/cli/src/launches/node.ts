import { resolveRequire } from '@wuzzle/helpers';
import { applyNodeLikeExtraOptions, execNode, LaunchFunction } from '../utils';

export const launchNode: LaunchFunction = ({ nodePath, args }) => {
  applyNodeLikeExtraOptions({ nodePath, name: 'wuzzle-node', args });

  const nodeRegisterPath = resolveRequire('../registers/node');

  execNode({
    nodePath,
    args,
    execArgs: ['-r', nodeRegisterPath, ...args],
  });
};
