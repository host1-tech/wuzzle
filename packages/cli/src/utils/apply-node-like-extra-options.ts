import { Command } from 'commander';
import { mergeWith, uniq } from 'lodash';
import { EK_NODE_LIKE_EXTRA_OPTIONS } from '../constants';
import { areArgsParsableByFlags } from './are-args-parsable-by-flags';

export interface NodeLikeExtraOptions {
  exts: string[];
}

export function getDefaultNodeLikeExtraOptions(): NodeLikeExtraOptions {
  return { exts: ['.js'] };
}

export function getCurrentNodeLikeExtraOptions(): NodeLikeExtraOptions {
  const options = getDefaultNodeLikeExtraOptions();
  try {
    mergeWith(options, JSON.parse(process.env[EK_NODE_LIKE_EXTRA_OPTIONS]!), (lVal, rVal) => {
      if (Array.isArray(lVal) && Array.isArray(rVal)) {
        return uniq([...lVal, ...rVal]);
      }
    });
  } catch {}
  return options;
}

export function getNodeLikeExtraCommandOpts() {
  const { exts } = getDefaultNodeLikeExtraOptions();
  return {
    Ext: [
      '-E,--ext <string>',
      'Specify file extensions for resolving, ' +
        `splitted by comma. (default: "${exts.join(',')}")`,
    ],
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
  const nodeLikeExtraOptions = getDefaultNodeLikeExtraOptions();
  const extraCommandOpts = getNodeLikeExtraCommandOpts();

  if (areArgsParsableByFlags({ args, flags: Object.values(extraCommandOpts).map(o => o[0]) })) {
    const extraCommandProg = new Command();

    extraCommandProg
      .option(...extraCommandOpts.Ext)
      .helpOption(...extraCommandOpts.Help)
      .allowUnknownOption();

    extraCommandProg.parse([nodePath, name, ...args]);

    nodeLikeExtraOptions.exts = extraCommandProg.ext.split(',');
    args.splice(0, args.length, ...extraCommandProg.args);
  }

  process.env[EK_NODE_LIKE_EXTRA_OPTIONS] = JSON.stringify(nodeLikeExtraOptions);
}
