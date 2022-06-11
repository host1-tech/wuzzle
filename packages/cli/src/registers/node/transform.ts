import { grey } from 'chalk';
import { noop } from 'lodash';
import path from 'path';
import { addHook } from 'pirates';
import sourceMapSupport from 'source-map-support';

import { logPlain, resolveRequire } from '@wuzzle/helpers';

import { CONFIG_FILENAME, EK } from '../../constants';
import { transpileSyncFromCacheOnly } from '../../transpile';
import { envGet, execNode } from '../../utils';
import { getConvertOptions } from './convert-helpers';

export function register() {
  if (envGet(EK.DRY_RUN)) {
    printDryRunLog();
    process.exit();
  }

  sourceMapSupport.install({ hookRequire: true });

  const projectPath = envGet(EK.PROJECT_PATH);
  const piratesOptions = {
    ext: envGet(EK.NODE_LIKE_EXTRA_OPTIONS).ext,
    matcher(file: string) {
      return file.startsWith(projectPath) && !file.endsWith(CONFIG_FILENAME);
    },
    ignoreNodeModules: true,
  };

  addHook(transform, piratesOptions);
}

export function printDryRunLog(): void {
  const convertPath = resolveRequire('./convert');
  execNode({
    execArgs: [convertPath],
    execOpts: { input: JSON.stringify(getConvertOptions()), stdin: 'pipe' },
  });
}

export function transform(_: string, file: string): string {
  const convertPath = resolveRequire('./convert');

  const verboseLog = envGet(EK.NODE_LIKE_EXTRA_OPTIONS).verbose ? logPlain : noop;
  let outputCode: string;
  const convertOptions = getConvertOptions({ inputPath: file });
  try {
    outputCode = transpileSyncFromCacheOnly(convertOptions);
    verboseLog(grey(`File '${path.relative(envGet(EK.PROJECT_PATH), file)}' from cache.`));
  } catch {
    // Uses synchronous process spawning to deasync the tranpiling.
    // It's slow but it's effective.
    outputCode = execNode({
      execArgs: [convertPath],
      execOpts: { input: JSON.stringify(convertOptions), stdin: 'pipe', stdout: 'pipe' },
    }).stdout;
    verboseLog(grey(`File '${path.relative(envGet(EK.PROJECT_PATH), file)}' compiled.`));
  }

  return outputCode;
}
