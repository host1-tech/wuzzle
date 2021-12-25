import { resolveRequire } from '@wuzzle/helpers';
import execa from 'execa';
import { mergeWith, uniq } from 'lodash';
import { addHook } from 'pirates';
import sourceMapSupport from 'source-map-support';
import { EK_DRY_RUN, EK_NODE_LIKE_EXTRA_OPTIONS } from '../../constants';
import { transpileDefaultOptions } from '../../transpile/transpile';
import { getDefaultNodeLikeExtraOptions, NodeLikeExtraOptions } from '../../utils';

export function register() {
  if (process.env[EK_DRY_RUN]) {
    printDryRunLog();
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

export function transform(code: string, file: string): string {
  const convertPath = resolveRequire('./convert');
  const nodePath = process.argv[0];
  // Uses synchronous process spawning to deasync the tranpiling.
  // It's slow but it's effective.
  const { stdout } = execa.sync(nodePath, [convertPath, file], {
    input: code,
    stderr: 'inherit',
  });
  return stdout;
}

export function printDryRunLog(): void {
  const convertPath = resolveRequire('./convert');
  const nodePath = process.argv[0];
  execa.sync(nodePath, [convertPath, transpileDefaultOptions.inputCodePath], {
    input: '',
    stdout: 'inherit',
    stderr: 'inherit',
  });
}
