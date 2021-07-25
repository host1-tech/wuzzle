import { resolveCommandPath, resolveCommandSemVer, resolveRequire } from '@wuzzle/helpers';
import { Command } from 'commander';
import { EXIT_CODE_ERROR } from '../constants';
import { areArgsParsableByFlags, execNode, LaunchFunction } from '../utils';

export const launchJest: LaunchFunction = ({ nodePath, args, projectPath, commandName }) => {
  let jestCommandPath: string;
  let jestMajorVersion: number;
  try {
    jestCommandPath = resolveCommandPath({ cwd: projectPath, commandName });
    jestMajorVersion = resolveCommandSemVer(jestCommandPath).major;
  } catch {
    console.error(`error: failed to resolve command '${commandName}'.`);
    process.exit(EXIT_CODE_ERROR);
  }

  const inspectNodeArgs: string[] = [];
  const inspectJestArgs: string[] = [];

  const extraOptions = {
    Inspect: '--inspect [string]',
    InspectBrk: '--inspect-brk [string]',
    Help: '-H,--help',
  };

  if (areArgsParsableByFlags({ args, flags: Object.values(extraOptions) })) {
    const extraProg = new Command();

    extraProg
      .option(extraOptions.Inspect, 'activate inspector')
      .option(extraOptions.InspectBrk, 'activate inspector and break at start of user scrip')
      .helpOption(extraOptions.Help, 'Output usage information.')
      .allowUnknownOption();

    extraProg.parse([nodePath, 'wuzzle-jest', ...args]);

    if (extraProg.inspect === true) {
      extraProg.inspect = '';
    }
    if (typeof extraProg.inspect === 'string') {
      inspectNodeArgs.splice(
        0,
        inspectNodeArgs.length,
        extraProg.inspect ? `--inspect=${extraProg.inspect}` : '--inspect'
      );
    }

    if (extraProg.inspectBrk === true) {
      extraProg.inspectBrk = '';
    }
    if (typeof extraProg.inspectBrk === 'string') {
      inspectNodeArgs.splice(
        0,
        inspectNodeArgs.length,
        extraProg.inspectBrk ? `--inspect-brk=${extraProg.inspectBrk}` : '--inspect-brk'
      );
    }

    if (inspectNodeArgs.length) {
      inspectJestArgs.splice(0, inspectJestArgs.length, '--runInBand');
    }

    args.splice(0, args.length, ...extraProg.args);
  }

  const jestRegisterPath = resolveRequire(`../registers/jest__${jestMajorVersion}.x`);

  execNode({
    nodePath,
    args,
    execArgs: [
      ...inspectNodeArgs,
      '-r',
      jestRegisterPath,
      jestCommandPath,
      ...inspectJestArgs,
      ...args,
    ],
  });
};
