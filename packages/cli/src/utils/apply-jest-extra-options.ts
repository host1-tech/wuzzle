import { Command } from 'commander';
import { areArgsParsableByFlags } from '.';
import { EK } from '../constants';
import { envGetDefault, envSet } from './env-get-set';

export interface JestExtraOptions {
  webpack: boolean;
}

export function getJestExtraCommandOpts() {
  return {
    NoWebpack: [
      '--no-webpack',
      'Skip webpack based compilation but use the original jest transforming.',
    ],
    Help: ['-H,--Help', 'Output usage information.'],
  } as const;
}

export interface ApplyJestExtraOptionsParams {
  nodePath?: string;
  name: string;
  args: string[];
}

export function applyJestExtraOptions({
  nodePath = process.argv[0],
  name,
  args,
}: ApplyJestExtraOptionsParams): void {
  const jestExtraOptions = envGetDefault(EK.JEST_EXTRA_OPTIONS);
  const extraCommandOpts = getJestExtraCommandOpts();

  if (areArgsParsableByFlags({ args, flags: Object.values(extraCommandOpts).map(o => o[0]) })) {
    const extraCommandProg = new Command();

    extraCommandProg
      .option(...extraCommandOpts.NoWebpack)
      .helpOption(...extraCommandOpts.Help)
      .allowUnknownOption();

    extraCommandProg.parse([nodePath, name, ...args]);

    jestExtraOptions.webpack = extraCommandProg.webpack;
    args.splice(0, args.length, ...extraCommandProg.args);
  }

  envSet(EK.JEST_EXTRA_OPTIONS, jestExtraOptions);
}
