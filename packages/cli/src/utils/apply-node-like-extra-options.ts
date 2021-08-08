import { Command } from 'commander';
import { EK_NODE_LIKE_EXTRA_OPTIONS } from '../constants';
import { areArgsParsableByFlags } from './are-args-parsable-by-flags';

export interface NodeLikeExtraOptions {
  exts: string[];
}

export function getDefaultNodeLikeExtraOptions(): NodeLikeExtraOptions {
  return { exts: ['.js'] };
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
  const nodeLikeExtraOptions: NodeLikeExtraOptions = getDefaultNodeLikeExtraOptions();

  const commandExtraOptions = {
    Ext: [
      '-E,--ext <string>',
      'Specify file extensions for resolving, ' +
        `splitted by comma. (default: "${nodeLikeExtraOptions.exts.join(',')}")`,
    ],
    Help: ['-H,--Help', 'Output usage information.'],
  } as const;

  if (areArgsParsableByFlags({ args, flags: Object.values(commandExtraOptions).map(o => o[0]) })) {
    const commandExtraProg = new Command();

    commandExtraProg
      .option(...commandExtraOptions.Ext)
      .helpOption(...commandExtraOptions.Help)
      .allowUnknownOption();

    commandExtraProg.parse([nodePath, name, ...args]);

    nodeLikeExtraOptions.exts = commandExtraProg.ext.split(',');
    args.splice(0, args.length, ...commandExtraProg.args);
  }

  process.env[EK_NODE_LIKE_EXTRA_OPTIONS] = JSON.stringify(nodeLikeExtraOptions);
}
