import { merge } from 'lodash';
import { addHook } from 'pirates';
import { transform } from './transform';
import { NodeLikeExtraOptions } from './types';

const nodeLikeExtraOptions: NodeLikeExtraOptions = {
  exts: ['.js'],
};

try {
  merge(nodeLikeExtraOptions, JSON.parse(process.env.WUZZLE_NODE_LIKE_EXTRA_OPTIONS || '{}'));
} catch {}

const piratesOptions = {
  ...nodeLikeExtraOptions,
  ignoreNodeModules: true,
};

addHook(transform, piratesOptions);
