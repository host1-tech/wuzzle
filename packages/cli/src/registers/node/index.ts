import { addHook } from 'pirates';
import { transform } from './transform';
import { mergeNodeLikeExtraOptionsFromEnv, NodeLikeExtraOptions } from './utils';

const nodeLikeExtraOptions: NodeLikeExtraOptions = {
  exts: ['.js'],
};

mergeNodeLikeExtraOptionsFromEnv(nodeLikeExtraOptions);

const piratesOptions = {
  ...nodeLikeExtraOptions,
  ignoreNodeModules: true,
};

addHook(transform, piratesOptions);
