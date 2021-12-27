import { resolveRequire } from '@wuzzle/helpers';
import execa from 'execa';
import { addHook } from 'pirates';
import sourceMapSupport from 'source-map-support';
import { EK_DRY_RUN } from '../../constants';
import { transpileDefaultOptions } from '../../transpile';
import { getCurrentNodeLikeExtraOptions } from '../../utils';

export function register() {
  if (process.env[EK_DRY_RUN]) {
    printDryRunLog();
    process.exit();
  }

  sourceMapSupport.install({ hookRequire: true });

  const piratesOptions = {
    ...getCurrentNodeLikeExtraOptions(),
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
