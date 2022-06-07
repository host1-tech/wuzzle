import { SimpleAsyncCall } from '@wuzzle/helpers';
import { Command } from 'commander';
import { EK } from '../constants';
import { areArgsParsableByFlags } from './are-args-parsable-by-flags';
import { envGetDefault, envSet } from './env-get-set';
import {
  getDefaultPreCompileOptions,
  getPreCompileCommandOpts,
  preCompile,
  PreCompileOptions,
  setPreCompileOptionsByCommandProg,
} from './pre-compile';

export interface NodeLikeExtraOptions {
  ext: string[];
  verbose: boolean;
}

export function getNodeLikeExtraCommandOpts() {
  const { ext } = envGetDefault(EK.NODE_LIKE_EXTRA_OPTIONS);
  const { PreCompile, PreCompileIgnore, PreCompileConcurrency, PreCompileFollow } =
    getPreCompileCommandOpts();

  return {
    Ext: [
      '-E,--ext <string>',
      `Specify file extensions for resolving, split by ",". (default: "${ext.join(',')}")`,
    ],
    NoVerbose: ['--no-verbose', 'Prevent printing compilation details.'],
    PreCompile: [PreCompile[0], `${PreCompile[1]} Only files matching '-E,--ext' get proceeded.`],
    PreCompileIgnore,
    PreCompileConcurrency,
    PreCompileFollow,
    Help: ['-H,--Help', 'Output extra usage information.'],
  } as const;
}

export interface ApplyNodeLikeExtraOptionsParams {
  nodePath?: string;
  name: string;
  args: string[];
}

export interface ApplyNodeLikeExtraOptionsResult {
  applyPreCompilation: SimpleAsyncCall;
}

export function applyNodeLikeExtraOptions({
  nodePath = process.argv[0],
  name,
  args,
}: ApplyNodeLikeExtraOptionsParams): ApplyNodeLikeExtraOptionsResult {
  const nodeLikeExtraOptions = envGetDefault(EK.NODE_LIKE_EXTRA_OPTIONS);
  const nodeLikeExtraCommandOpts = getNodeLikeExtraCommandOpts();
  const preCompileOptions = getDefaultPreCompileOptions({ verbose: nodeLikeExtraOptions.verbose });

  if (
    areArgsParsableByFlags({
      args,
      flags: Object.values(nodeLikeExtraCommandOpts).map(o => o[0]),
    })
  ) {
    const extraCommandProg = new Command();
    extraCommandProg
      .option(...nodeLikeExtraCommandOpts.Ext)
      .option(...nodeLikeExtraCommandOpts.NoVerbose)
      .option(...nodeLikeExtraCommandOpts.PreCompile)
      .option(...nodeLikeExtraCommandOpts.PreCompileIgnore)
      .option(...nodeLikeExtraCommandOpts.PreCompileConcurrency)
      .option(...nodeLikeExtraCommandOpts.PreCompileFollow)
      .helpOption(...nodeLikeExtraCommandOpts.Help)
      .allowUnknownOption();
    extraCommandProg.parse([nodePath, name, ...args]);

    if (extraCommandProg.ext !== undefined) {
      const ext = (extraCommandProg.ext as string).split(',').filter(e => e.startsWith('.'));
      if (ext.length) {
        nodeLikeExtraOptions.ext = ext;
      }
    }
    if (extraCommandProg.verbose !== undefined) {
      nodeLikeExtraOptions.verbose = extraCommandProg.verbose;
    }

    extraCommandProg.preCompileVerbose = extraCommandProg.verbose;
    setPreCompileOptionsByCommandProg(preCompileOptions, extraCommandProg);

    args.splice(0, args.length, ...extraCommandProg.args);
  }

  envSet(EK.NODE_LIKE_EXTRA_OPTIONS, nodeLikeExtraOptions);

  const preCompileOptionsToUse: PreCompileOptions = {
    ...preCompileOptions,
    filter: file => nodeLikeExtraOptions.ext.some(e => file.endsWith(e)),
  };

  return {
    applyPreCompilation: () => preCompile(preCompileOptionsToUse),
  };
}
