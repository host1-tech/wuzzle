import { addHook } from 'pirates';
import sourceMapSupport from 'source-map-support';
import { transform } from './transform';
import { mergeNodeLikeExtraOptionsFromEnv, NodeLikeExtraOptions } from './utils';

sourceMapSupport.install({ hookRequire: true });

const nodeLikeExtraOptions: NodeLikeExtraOptions = {
  exts: ['.js'],
};

mergeNodeLikeExtraOptionsFromEnv(nodeLikeExtraOptions);

const piratesOptions = {
  ...nodeLikeExtraOptions,
  ignoreNodeModules: true,
};

addHook(transform, piratesOptions);
