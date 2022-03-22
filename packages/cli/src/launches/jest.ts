import { logError, logPlain, resolveCommandPath, resolveCommandSemVer } from '@wuzzle/helpers';
import { Command } from 'commander';
import { EK_JEST_EXTRA_OPTIONS, EXIT_CODE_ERROR } from '../constants';
import {
  areArgsParsableByFlags,
  execNode,
  getDefaultJestExtraOptions,
  getJestExtraCommandOpts,
  LaunchFunction,
  tmplLogForGlobalResolving,
} from '../utils';

export const launchJest: LaunchFunction = ({ nodePath, args, projectPath, commandName }) => {
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

  const jestExtraOptions = getDefaultJestExtraOptions();

  const inspectNodeArgs: string[] = [];
  const inspectJestArgs: string[] = [];

  const extraCommandOpts = {
    ...getJestExtraCommandOpts(),
    Inspect: ['--inspect [string]', 'Activate inspector.'],
    InspectBrk: ['--inspect-brk [string]', 'Activate inspector and break at start of user script.'],
    Help: ['-H,--Help', 'Output usage information.'],
  } as const;

  if (areArgsParsableByFlags({ args, flags: Object.values(extraCommandOpts).map(o => o[0]) })) {
    const extraCommandProg = new Command();

    extraCommandProg
      .option(...extraCommandOpts.NoWebpack)
      .option(...extraCommandOpts.Inspect)
      .option(...extraCommandOpts.InspectBrk)
      .helpOption(...extraCommandOpts.Help)
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

    jestExtraOptions.webpack = extraCommandProg.webpack;

    args.splice(0, args.length, ...extraCommandProg.args);
  }

  process.env[EK_JEST_EXTRA_OPTIONS] = JSON.stringify(jestExtraOptions);

  require(`../registers/jest__${jestMajorVersion}.x`).register({
    commandPath: jestCommandPath,
  });

  execNode({
    nodePath,
    args,
    execArgs: [...inspectNodeArgs, jestCommandPath, ...inspectJestArgs, ...args],
  });
};
