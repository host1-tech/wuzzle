import { logError, logPlain } from '@wuzzle/helpers';
import { grey, yellow } from 'chalk';
import { Command } from 'commander';
import glob from 'glob';
import { cloneDeep, noop, uniq } from 'lodash';
import os from 'os';
import pMap from 'p-map';
import path from 'path';
import { EK } from '../constants';
import { getConvertOptions } from '../registers/node/convert-helpers';
import { areArgsParsableByFlags } from './are-args-parsable-by-flags';
import { envGet, envGetDefault, envSet } from './env-get-set';

export interface NodeLikeExtraOptions {
  ext: string[];
  verbose: boolean;
}

export interface NodeLikePreCompileOptions {
  inputGlobs: string[];
  ignore: string[];
  concurrency: number;
  follow: boolean;
}

export const DefaultNodeLikePreCompileOptions: NodeLikePreCompileOptions = {
  inputGlobs: [],
  ignore: ['**/node_modules/**', '**/*.d.ts?(x)'],
  concurrency: os.cpus().length,
  follow: false,
};

export function getNodeLikeExtraCommandOpts() {
  const { ext } = envGetDefault(EK.NODE_LIKE_EXTRA_OPTIONS);
  return {
    Ext: [
      '-E,--ext <string>',
      `Specify file extensions for resolving, split by ",". (default: "${ext.join(',')}")`,
    ],
    NoVerbose: ['--no-verbose', 'Prevent printing compilation details.'],
    PreCompile: [
      '-P,--pre-compile <string>',
      'Specify globs to be pre-compiled for faster overall execution, split by ",". ' +
        `Only files matching '-E,--ext' get proceeded.`,
    ],
    PreCompileIgnore: [
      '--pre-compile-ignore <string>',
      `List of globs not to pre-compile, split by ",". ` +
        `(default: "${DefaultNodeLikePreCompileOptions.ignore.join(',')}")`,
    ],
    PreCompileConcurrency: [
      '--pre-compile-concurrency <number>',
      'Prevent pre-compiling more than specific amount of files at the same time. ' +
        '(default: os.cpus().length)',
    ],
    PreCompileFollow: [
      '--pre-compile-follow',
      `Follow symlinked directories to pre-compile when expanding "**" patterns.`,
    ],
    Help: ['-H,--Help', 'Output extra usage information.'],
  } as const;
}

export interface ApplyNodeLikeExtraOptionsParams {
  nodePath?: string;
  name: string;
  args: string[];
}

export async function applyNodeLikeExtraOptions({
  nodePath = process.argv[0],
  name,
  args,
}: ApplyNodeLikeExtraOptionsParams): Promise<void> {
  const { transpile } = require('../transpile'); // Breaks circular require resolving

  const nodeLikeExtraOptions = envGetDefault(EK.NODE_LIKE_EXTRA_OPTIONS);
  const nodeLikePreCompileOptions = cloneDeep(DefaultNodeLikePreCompileOptions);
  const extraCommandOpts = getNodeLikeExtraCommandOpts();

  if (areArgsParsableByFlags({ args, flags: Object.values(extraCommandOpts).map(o => o[0]) })) {
    const extraCommandProg = new Command();

    extraCommandProg
      .option(...extraCommandOpts.Ext)
      .option(...extraCommandOpts.NoVerbose)
      .option(...extraCommandOpts.PreCompile)
      .option(...extraCommandOpts.PreCompileIgnore)
      .option(...extraCommandOpts.PreCompileConcurrency)
      .option(...extraCommandOpts.PreCompileFollow)
      .helpOption(...extraCommandOpts.Help)
      .allowUnknownOption();

    extraCommandProg.parse([nodePath, name, ...args]);

    if (extraCommandProg.ext) {
      const ext = (extraCommandProg.ext as string).split(',').filter(e => e.includes('.'));
      if (ext.length) {
        nodeLikeExtraOptions.ext = ext;
      }
    }
    nodeLikeExtraOptions.verbose = extraCommandProg.verbose;

    if (extraCommandProg.preCompile) {
      nodeLikePreCompileOptions.inputGlobs = (extraCommandProg.preCompile as string).split(',');
    }
    if (extraCommandProg.preCompileIgnore) {
      nodeLikePreCompileOptions.ignore = (extraCommandProg.preCompileIgnore as string).split(',');
    }
    if (extraCommandProg.preCompileConcurrency) {
      nodeLikePreCompileOptions.concurrency = parseInt(extraCommandProg.preCompileConcurrency);
    }
    nodeLikePreCompileOptions.follow = extraCommandProg.preCompileFollow;

    args.splice(0, args.length, ...extraCommandProg.args);
  }

  envSet(EK.NODE_LIKE_EXTRA_OPTIONS, nodeLikeExtraOptions);

  const projectPath = envGet(EK.PROJECT_PATH);
  const verboseLog = nodeLikeExtraOptions.verbose ? logPlain : noop;
  const forceLog = logPlain;

  const preCompileInputPaths = uniq(
    nodeLikePreCompileOptions.inputGlobs
      .map(g =>
        glob.sync(g, {
          cwd: projectPath,
          absolute: true,
          nodir: true,
          ...nodeLikePreCompileOptions,
        })
      )
      .reduce((m, p) => (m.push(...p), m), [])
      .filter(p => nodeLikeExtraOptions.ext.some(e => p.includes(e)))
  );

  await pMap(preCompileInputPaths, preCompileAction, nodeLikePreCompileOptions);

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
