import { resolveRequire } from '@wuzzle/helpers';
import { EK_INTERNAL_PRE_CONFIG } from '../constants';
import { applyNodeLikeExtraOptions, execNode, LaunchFunction } from '../utils';

export const launchNode: LaunchFunction = ({ nodePath, args }) => {
  applyNodeLikeExtraOptions({ nodePath, name: 'wuzzle-node', args });

  const nodeRegisterPath = resolveRequire('../registers/node');
  process.env[EK_INTERNAL_PRE_CONFIG] = resolveRequire('../registers/node/pre-config');

  execNode({
    nodePath,
    args,
    execArgs: ['-r', nodeRegisterPath, ...args],
  });
};
