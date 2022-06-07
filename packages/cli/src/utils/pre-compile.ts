import { logError, logPlain } from '@wuzzle/helpers';
import { grey, yellow } from 'chalk';
import commander from 'commander';
import glob from 'glob';
import { noop, uniq } from 'lodash';
import os from 'os';
import pMap from 'p-map';
import path from 'path';
import { EK } from '../constants';
import { getConvertOptions } from '../registers/node/convert-helpers';
import { envGet } from './env-get-set';

export interface PreCompileOptions {
  inputGlobs: string[];
  ignore: string[];
  concurrency: number;
  follow: boolean;
  filter(file: string): boolean;
  verbose: boolean;
}

export function getDefaultPreCompileOptions(
  override: Partial<PreCompileOptions> = {}
): PreCompileOptions {
  return {
    inputGlobs: [],
    ignore: ['**/node_modules/**', '**/*.d.ts?(x)'],
    concurrency: os.cpus().length,
    follow: false,
    filter: () => true,
    verbose: true,
    ...override,
  };
}

export function getPreCompileCommandOpts() {
  const { ignore } = getDefaultPreCompileOptions();
  return {
    PreCompile: [
      '-P,--pre-compile <string>',
      'Specify globs to be pre-compiled for faster overall execution, split by ",".',
    ],
    PreCompileIgnore: [
      '--pre-compile-ignore <string>',
      `List of globs not to pre-compile, split by ",". (default: "${ignore.join(',')}")`,
    ],
    PreCompileConcurrency: [
      '--pre-compile-concurrency <number>',
      'Prevent pre-compiling more than specific amount of files at the same time. ' +
        '(default: os.cpus().length)',
    ],
    PreCompileFollow: [
      '--pre-compile-follow',
      'Follow symlinked directories to pre-compile when expanding "**" patterns.',
    ],
    NoPreCompileVerbose: ['--no-pre-compile-verbose', 'Prevent printing pre-compilation details.'],
  } as const;
}

export function setPreCompileOptionsByCommandProg(
  preCompileOptions: PreCompileOptions,
  commandProg: commander.Command
): void {
  if (commandProg.preCompile !== undefined) {
    preCompileOptions.inputGlobs = (commandProg.preCompile as string).split(',');
  }
  if (commandProg.preCompileIgnore !== undefined) {
    preCompileOptions.ignore = (commandProg.preCompileIgnore as string).split(',');
  }
  if (commandProg.preCompileConcurrency !== undefined) {
    preCompileOptions.concurrency = parseInt(commandProg.preCompileConcurrency);
  }
  if (commandProg.preCompileFollow !== undefined) {
    preCompileOptions.follow = commandProg.preCompileFollow;
  }
  if (commandProg.preCompileVerbose !== undefined) {
    preCompileOptions.verbose = commandProg.preCompileVerbose;
  }
}

export async function preCompile(options: PreCompileOptions): Promise<void> {
  const { transpile } = require('../transpile'); // Breaks circular require resolving
  const { inputGlobs, ignore, concurrency, follow, filter, verbose } = options;

  const projectPath = envGet(EK.PROJECT_PATH);
  const verboseLog = verbose ? logPlain : noop;
  const forceLog = logPlain;

  const inputPaths = uniq(
    inputGlobs
      .map(g => glob.sync(g, { cwd: projectPath, absolute: true, nodir: true, ignore, follow }))
      .reduce((m, p) => (m.push(...p), m), [])
      .filter(filter)
  );

  await pMap(inputPaths, preCompileAction, { concurrency });

  async function preCompileAction(inputPath: string) {
    try {
      await transpile(getConvertOptions({ inputPath }));
      verboseLog(grey(`File '${path.relative(projectPath, inputPath)}' pre-compiled.`));
    } catch (e) {
      forceLog(yellow(`File '${path.relative(projectPath, inputPath)}' pre-compilation failed.`));
      logError(e);
    }
  }
}
