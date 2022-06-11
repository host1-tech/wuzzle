import { Command } from 'commander';

import { logError, logPlain, resolveCommandPath, resolveCommandSemVer } from '@wuzzle/helpers';

import { EK, EXIT_CODE_ERROR } from '../constants';
import {
  areArgsParsableByFlags,
  doFileRegistering,
  envGet,
  envGetDefault,
  envSet,
  execNode,
  getDefaultPreCompileOptions,
  getJestExtraCommandOpts,
  LaunchFunction,
  preCompile,
  setPreCompileOptionsByCommandProg,
  tmplLogForGlobalResolving,
} from '../utils';

export const launchJest: LaunchFunction = async ({ nodePath, args, projectPath, commandName }) => {
  let jestCommandPath: string;
  let jestMajorVersion: number;
  try {
    try {
      jestCommandPath = resolveCommandPath({ cwd: projectPath, commandName });
    } catch {
      jestCommandPath = resolveCommandPath({ cwd: projectPath, commandName, fromGlobals: true });
      logPlain(tmplLogForGlobalResolving({ commandName, commandPath: jestCommandPath }));
    }
    jestMajorVersion = resolveCommandSemVer(jestCommandPath).major;
  } catch {
    logError(`error: failed to resolve command '${commandName}'.`);
    process.exit(EXIT_CODE_ERROR);
  }

  const jestExtraOptions = envGetDefault(EK.JEST_EXTRA_OPTIONS);
  const jestExtraCommandOpts = {
    ...getJestExtraCommandOpts(),
    Inspect: ['--inspect [string]', 'Activate inspector.'],
    InspectBrk: ['--inspect-brk [string]', 'Activate inspector and break at start of user script.'],
    Help: ['-H,--Help', 'Output extra usage information.'],
  } as const;
  const preCompileOptions = getDefaultPreCompileOptions();

  const inspectNodeArgs: string[] = [];
  const inspectJestArgs: string[] = [];

  if (areArgsParsableByFlags({ args, flags: Object.values(jestExtraCommandOpts).map(o => o[0]) })) {
    const extraCommandProg = new Command();

    extraCommandProg
      .option(...jestExtraCommandOpts.NoWebpack)
      .option(...jestExtraCommandOpts.Inspect)
      .option(...jestExtraCommandOpts.InspectBrk)
      .option(...jestExtraCommandOpts.PreCompile)
      .option(...jestExtraCommandOpts.PreCompileIgnore)
      .option(...jestExtraCommandOpts.PreCompileConcurrency)
      .option(...jestExtraCommandOpts.PreCompileFollow)
      .option(...jestExtraCommandOpts.NoPreCompileVerbose)
      .helpOption(...jestExtraCommandOpts.Help)
      .allowUnknownOption();

    extraCommandProg.parse([nodePath, 'wuzzle-jest', ...args]);

    if (extraCommandProg.inspect === true) {
      extraCommandProg.inspect = '';
    }
    if (typeof extraCommandProg.inspect === 'string') {
      inspectNodeArgs.splice(
        0,
        inspectNodeArgs.length,
        extraCommandProg.inspect ? `--inspect=${extraCommandProg.inspect}` : '--inspect'
      );
    }

    if (extraCommandProg.inspectBrk === true) {
      extraCommandProg.inspectBrk = '';
    }
    if (typeof extraCommandProg.inspectBrk === 'string') {
      inspectNodeArgs.splice(
        0,
        inspectNodeArgs.length,
        extraCommandProg.inspectBrk
          ? `--inspect-brk=${extraCommandProg.inspectBrk}`
          : '--inspect-brk'
      );
    }

    if (inspectNodeArgs.length) {
      inspectJestArgs.splice(0, inspectJestArgs.length, '--runInBand');
    }

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

  doFileRegistering({
    registerName: 'jest',
    majorVersion: jestMajorVersion,
    commandPath: jestCommandPath,
  });

  await preCompile(preCompileOptions);

  execNode({
    nodePath,
    execArgs: [...inspectNodeArgs, jestCommandPath, ...inspectJestArgs, ...args],
  });
};
