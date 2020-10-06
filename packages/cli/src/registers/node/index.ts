import { merge } from 'lodash';
import { addHook } from 'pirates';
import type { NodeLikeExtraOptions } from '../../bin/wuzzle';
import { transform } from './transform';

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
