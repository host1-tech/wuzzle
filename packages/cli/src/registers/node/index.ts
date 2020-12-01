import { merge } from 'lodash';
import { addHook } from 'pirates';
import sourceMapSupport from 'source-map-support';
import { EK_NODE_LIKE_EXTRA_OPTIONS } from '../../constants';
import { transform } from './transform';

sourceMapSupport.install({ hookRequire: true });

const options: NodeLikeExtraOptions = {
  exts: ['.js'],
};

try {
  merge(options, JSON.parse(process.env[EK_NODE_LIKE_EXTRA_OPTIONS]!));
} catch {}

const piratesOptions = {
  ...options,
  ignoreNodeModules: true,
};

addHook(transform, piratesOptions);

export interface NodeLikeExtraOptions {
  exts: string[];
}
