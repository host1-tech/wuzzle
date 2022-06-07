import { SimpleAsyncCall } from '@wuzzle/helpers';
import { Command } from 'commander';
import { areArgsParsableByFlags } from '.';
import { EK } from '../constants';
import { envGet, envGetDefault, envSet } from './env-get-set';
import {
  getDefaultPreCompileOptions,
  getPreCompileCommandOpts,
  preCompile,
  setPreCompileOptionsByCommandProg,
} from './pre-compile';

export interface JestExtraOptions {
  webpack: boolean;
}

export function getJestExtraCommandOpts() {
  return {
    NoWebpack: [
      '--no-webpack',
      'Skip webpack based compilation but use the original jest transforming.',
    ],
    ...getPreCompileCommandOpts(),
    Help: ['-H,--Help', 'Output extra usage information.'],
  } as const;
}

export interface ApplyJestExtraOptionsParams {
  nodePath?: string;
  name: string;
  args: string[];
}

export interface ApplyJestExtraOptionsResult {
  applyPreCompilation: SimpleAsyncCall;
}

export function applyJestExtraOptions({
  nodePath = process.argv[0],
  name,
  args,
}: ApplyJestExtraOptionsParams): ApplyJestExtraOptionsResult {
  const jestExtraOptions = envGetDefault(EK.JEST_EXTRA_OPTIONS);
  const jestExtraCommandOpts = getJestExtraCommandOpts();
  const preCompileOptions = getDefaultPreCompileOptions();

  if (areArgsParsableByFlags({ args, flags: Object.values(jestExtraCommandOpts).map(o => o[0]) })) {
    const extraCommandProg = new Command();

    extraCommandProg
      .option(...jestExtraCommandOpts.NoWebpack)
      .option(...jestExtraCommandOpts.PreCompile)
      .option(...jestExtraCommandOpts.PreCompileIgnore)
      .option(...jestExtraCommandOpts.PreCompileConcurrency)
      .option(...jestExtraCommandOpts.PreCompileFollow)
      .option(...jestExtraCommandOpts.NoPreCompileVerbose)
      .helpOption(...jestExtraCommandOpts.Help)
      .allowUnknownOption();

    extraCommandProg.parse([nodePath, name, ...args]);

    if (extraCommandProg.webpack !== undefined) {
      jestExtraOptions.webpack = extraCommandProg.webpack;
    }

    if (jestExtraOptions.webpack) {
      setPreCompileOptionsByCommandProg(preCompileOptions, extraCommandProg);
    }

    args.splice(0, args.length, ...extraCommandProg.args);
  }

  envSet(EK.JEST_EXTRA_OPTIONS, jestExtraOptions);
  if (!envGet('NODE_ENV')) {
    envSet('NODE_ENV', 'test');
  }

  return {
    applyPreCompilation: () => preCompile(preCompileOptions),
  };
}
