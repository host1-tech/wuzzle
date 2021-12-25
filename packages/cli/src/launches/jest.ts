import { resolveCommandPath, resolveCommandSemVer } from '@wuzzle/helpers';
import { Command } from 'commander';
import { EK_JEST_EXTRA_OPTIONS, EXIT_CODE_ERROR } from '../constants';
import {
  areArgsParsableByFlags,
  execNode,
  LaunchFunction,
  tmplLogForGlobalResolving,
} from '../utils';

export interface JestExtraOptions {
  webpack: boolean;
}

export function getDefaultJestExtraOptions(): JestExtraOptions {
  return { webpack: true };
}

export const launchJest: LaunchFunction = ({ nodePath, args, projectPath, commandName }) => {
  let jestCommandPath: string;
  let jestMajorVersion: number;
  try {
    try {
      jestCommandPath = resolveCommandPath({ cwd: projectPath, commandName });
    } catch {
      jestCommandPath = resolveCommandPath({ cwd: projectPath, commandName, fromGlobals: true });
      console.log(tmplLogForGlobalResolving({ commandName, commandPath: jestCommandPath }));
    }
    jestMajorVersion = resolveCommandSemVer(jestCommandPath).major;
  } catch {
    console.error(`error: failed to resolve command '${commandName}'.`);
    process.exit(EXIT_CODE_ERROR);
  }

  const jestExtraOptions: JestExtraOptions = getDefaultJestExtraOptions();

  const inspectNodeArgs: string[] = [];
  const inspectJestArgs: string[] = [];

  const commandExtraOptions = {
    NoWebpack: '--no-webpack',
    Inspect: '--inspect [string]',
    InspectBrk: '--inspect-brk [string]',
    Help: '-H,--Help',
  };

  if (areArgsParsableByFlags({ args, flags: Object.values(commandExtraOptions) })) {
    const commandExtraProg = new Command();

    commandExtraProg
      .option(commandExtraOptions.NoWebpack, 'Skip webpack based transforming')
      .option(commandExtraOptions.Inspect, 'Activate inspector')
      .option(
        commandExtraOptions.InspectBrk,
        'Activate inspector and break at start of user script'
      )
      .helpOption(commandExtraOptions.Help, 'Output usage information.')
      .allowUnknownOption();

    commandExtraProg.parse([nodePath, 'wuzzle-jest', ...args]);

    if (commandExtraProg.inspect === true) {
      commandExtraProg.inspect = '';
    }
    if (typeof commandExtraProg.inspect === 'string') {
      inspectNodeArgs.splice(
        0,
        inspectNodeArgs.length,
        commandExtraProg.inspect ? `--inspect=${commandExtraProg.inspect}` : '--inspect'
      );
    }

    if (commandExtraProg.inspectBrk === true) {
      commandExtraProg.inspectBrk = '';
    }
    if (typeof commandExtraProg.inspectBrk === 'string') {
      inspectNodeArgs.splice(
        0,
        inspectNodeArgs.length,
        commandExtraProg.inspectBrk
          ? `--inspect-brk=${commandExtraProg.inspectBrk}`
          : '--inspect-brk'
      );
    }

    if (inspectNodeArgs.length) {
      inspectJestArgs.splice(0, inspectJestArgs.length, '--runInBand');
    }

    jestExtraOptions.webpack = commandExtraProg.webpack;

    args.splice(0, args.length, ...commandExtraProg.args);
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
