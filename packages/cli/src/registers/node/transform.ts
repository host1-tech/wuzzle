import { logPlain, resolveRequire } from '@wuzzle/helpers';
import { grey } from 'chalk';
import fs from 'fs';
import path from 'path';
import { addHook } from 'pirates';
import sourceMapSupport from 'source-map-support';
import { EK_DRY_RUN, EK_PROJECT_PATH, ENCODING_BINARY, ENCODING_TEXT } from '../../constants';
import { transpileDefaultOptions } from '../../transpile';
import { execNode, getCurrentNodeLikeExtraOptions } from '../../utils';

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
  execNode({
    execArgs: [convertPath, transpileDefaultOptions.inputCodePath, ENCODING_TEXT],
    execOpts: { input: '', stdin: 'pipe' },
  });
}

export function transform(_: string, file: string): string {
  // Enforces binary encoding in the input code to work with binary files.
  const encoding = ENCODING_BINARY;
  const code = fs.readFileSync(file, encoding);
  const convertPath = resolveRequire('./convert');

  // Uses synchronous process spawning to deasync the tranpiling.
  // It's slow but it's effective.
  const { stdout } = execNode({
    execArgs: [convertPath, file, encoding],
    execOpts: { input: code, stdin: 'pipe', stdout: 'pipe' },
  });

  if (getCurrentNodeLikeExtraOptions().verbose) {
    logPlain(grey(`File '${path.relative(process.env[EK_PROJECT_PATH]!, file)}' compiled.`));
  }
  return stdout;
}
