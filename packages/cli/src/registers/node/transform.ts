import { resolveRequire } from '@wuzzle/helpers';
import { grey } from 'chalk';
import execa from 'execa';
import fs from 'fs';
import path from 'path';
import { addHook } from 'pirates';
import sourceMapSupport from 'source-map-support';
import { EK_DRY_RUN, ENCODING_BINARY, ENCODING_TEXT } from '../../constants';
import { transpileDefaultOptions } from '../../transpile';
import { getCurrentNodeLikeExtraOptions } from '../../utils';

export function register() {
  if (process.env[EK_DRY_RUN]) {
    printDryRunLog();
    process.exit();
  }

  sourceMapSupport.install({ hookRequire: true });

  const { exts } = getCurrentNodeLikeExtraOptions();
  const piratesOptions = {
    exts,
    ignoreNodeModules: true,
  };

  addHook(transform, piratesOptions);
}

export function printDryRunLog(): void {
  const convertPath = resolveRequire('./convert');
  const nodePath = process.argv[0];
  execa.sync(nodePath, [convertPath, transpileDefaultOptions.inputCodePath, ENCODING_TEXT], {
    input: '',
    stdout: 'inherit',
    stderr: 'inherit',
  });
}

export function transform(_: string, file: string): string {
  // Enforces binary encoding in the input code to work with binary files.
  const encoding = ENCODING_BINARY;
  const code = fs.readFileSync(file, encoding);
  const convertPath = resolveRequire('./convert');
  const nodePath = process.argv[0];
  // Uses synchronous process spawning to deasync the tranpiling.
  // It's slow but it's effective.
  const { stdout } = execa.sync(nodePath, [convertPath, file, encoding], {
    input: code,
    stderr: 'inherit',
  });
  if (getCurrentNodeLikeExtraOptions().verbose) {
    console.log(grey(`File '${path.relative(process.cwd(), file)}' compiled.`));
  }
  return stdout;
}
