import { Command } from 'commander';
import { areArgsParsableByFlags } from '.';
import { EK_JEST_EXTRA_OPTIONS } from '../constants';

export interface JestExtraOptions {
  webpack: boolean;
}

export function getDefaultJestExtraOptions(): JestExtraOptions {
  return { webpack: true };
}

export function getCurrentJestExtraOptions(): JestExtraOptions {
  const options = getDefaultJestExtraOptions();
  try {
    Object.assign(options, JSON.parse(process.env[EK_JEST_EXTRA_OPTIONS]!));
  } catch {}
  return options;
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
  const jestExtraOptions = getDefaultJestExtraOptions();
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

  process.env[EK_JEST_EXTRA_OPTIONS] = JSON.stringify(jestExtraOptions);
}
