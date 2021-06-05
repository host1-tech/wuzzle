import { mergeWith, uniq } from 'lodash';
import { addHook } from 'pirates';
import sourceMapSupport from 'source-map-support';
import { EK_NODE_LIKE_EXTRA_OPTIONS } from '../../constants';
import { getDefaultNodeLikeExtraOptions, NodeLikeExtraOptions } from '../../utils';
import { transform } from './transform';

sourceMapSupport.install({ hookRequire: true });

const options: NodeLikeExtraOptions = getDefaultNodeLikeExtraOptions();

try {
  mergeWith(options, JSON.parse(process.env[EK_NODE_LIKE_EXTRA_OPTIONS]!), (lVal, rVal) => {
    if (Array.isArray(lVal) && Array.isArray(rVal)) {
      return uniq([...lVal, ...rVal]);
    }
  });
} catch {}

const piratesOptions = {
  ...options,
  ignoreNodeModules: true,
};

addHook(transform, piratesOptions);
