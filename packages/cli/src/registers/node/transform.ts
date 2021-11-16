import { resolveRequire } from '@wuzzle/helpers';
import execa from 'execa';
import { mergeWith, uniq } from 'lodash';
import os from 'os';
import { addHook } from 'pirates';
import sourceMapSupport from 'source-map-support';
import { EK_DRY_RUN, EK_NODE_LIKE_EXTRA_OPTIONS } from '../../constants';
import { transpileDefaultOptions } from '../../transpile/transpile';
import { getDefaultNodeLikeExtraOptions, NodeLikeExtraOptions } from '../../utils';

export function register() {
  if (process.env[EK_DRY_RUN]) {
    transform();
    process.stderr.write(os.EOL);
    process.exit();
  }

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
}

export function transform(
  code: string = '',
  file: string = transpileDefaultOptions.inputCodePath
): string {
  const convertPath = resolveRequire('./convert');
  const nodePath = process.argv[0];
  // A tens-of-lines file usually takes hundreds of milliseconds to get webpack-compiled.
  // Compare to it, process spawning only takes less than 1/10 of the time. So here
  // introduced synchronous process spawning to synchronize an async tranpiling function.
  const { stdout } = execa.sync(nodePath, [convertPath, file], {
    input: code,
    stderr: 'inherit',
  });
  return stdout;
}
