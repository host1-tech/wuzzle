import { Command } from 'commander';
import { EK } from '../constants';
import { areArgsParsableByFlags } from './are-args-parsable-by-flags';
import { envGetDefault, envSet } from './env-get-set';

export interface NodeLikeExtraOptions {
  verbose: boolean;
  exts: string[];
}

export function getNodeLikeExtraCommandOpts() {
  const { exts } = envGetDefault(EK.NODE_LIKE_EXTRA_OPTIONS);
  return {
    Ext: [
      '-E,--ext <string>',
      'Specify file extensions for resolving, ' +
        `splitted by comma. (default: "${exts.join(',')}")`,
    ],
    NoVerbose: ['--no-verbose', 'Prevent printing compilation details.'],
    Help: ['-H,--Help', 'Output usage information.'],
  } as const;
}

export interface ApplyNodeLikeExtraOptionsParams {
  nodePath?: string;
  name: string;
  args: string[];
}

export function applyNodeLikeExtraOptions({
  nodePath = process.argv[0],
  name,
  args,
}: ApplyNodeLikeExtraOptionsParams): void {
  const nodeLikeExtraOptions = envGetDefault(EK.NODE_LIKE_EXTRA_OPTIONS);
  const extraCommandOpts = getNodeLikeExtraCommandOpts();

  if (areArgsParsableByFlags({ args, flags: Object.values(extraCommandOpts).map(o => o[0]) })) {
    const extraCommandProg = new Command();

    extraCommandProg
      .option(...extraCommandOpts.Ext)
      .option(...extraCommandOpts.NoVerbose)
      .helpOption(...extraCommandOpts.Help)
      .allowUnknownOption();

    extraCommandProg.parse([nodePath, name, ...args]);

    nodeLikeExtraOptions.exts = extraCommandProg.ext.split(',');
    nodeLikeExtraOptions.verbose = extraCommandProg.verbose;
    args.splice(0, args.length, ...extraCommandProg.args);
  }

  envSet(EK.NODE_LIKE_EXTRA_OPTIONS, nodeLikeExtraOptions);
}
