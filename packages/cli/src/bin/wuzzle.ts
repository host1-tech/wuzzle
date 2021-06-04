import { resolveCommandPath, resolveCommandSemVer, resolveWebpackSemVer } from '@wuzzle/helpers';
import { Command } from 'commander';
import execa from 'execa';
import findUp from 'find-up';
import path from 'path';
import shelljs from 'shelljs';
import {
  EK_COMMAND_ARGS,
  EK_COMMAND_NAME,
  EK_INTERNAL_PRE_CONFIG,
  EK_NODE_LIKE_EXTRA_OPTIONS,
  EK_REACT_SCRIPTS_SKIP_PREFLIGHT_CHECK,
  EK_RPOJECT_ANCHOR,
} from '../constants';
import type { NodeLikeExtraOptions } from '../registers/node';
import { areArgsParsableByFlags } from '../utils';

const anchorName = process.env[EK_RPOJECT_ANCHOR] || 'package.json';
const anchorPath = findUp.sync(anchorName);

if (!anchorPath) {
  console.error(`error: '${anchorName}' not located.`);
  process.exit(1);
}

const projectPath = path.dirname(anchorPath);

const [nodePath, , commandName, ...args] = process.argv;

// Set command name as an env variable to help wuzzle user config setup
process.env[EK_COMMAND_NAME] = commandName;

switch (commandName) {
  case 'webpack':
    launchWebpack();
    break;

  case 'electron-webpack':
    launchElectronWebpack();
    break;

  case 'next':
    launchNext();
    break;

  case 'taro':
    launchTaro();
    break;

  case 'build-storybook':
  case 'start-storybook':
  case 'storybook-server':
    launchStorybook();
    break;

  case 'react-scripts':
    launchReactScripts();
    break;

  case 'razzle':
    launchRazzle();
    break;

  case 'transpile':
    launchTranspile();
    break;

  case 'node':
    launchNode();
    break;

  case 'mocha':
    launchMocha();
    break;

  case 'jest':
    launchJest();
    break;

  default:
    if (commandName) {
      launchDefault();
    } else {
      console.error('error: command name not specified.');
      process.exit(1);
    }
}

// Entries

function launchWebpack() {
  launchDefault();
}

function launchElectronWebpack() {
  launchDefault();
}

function launchNext() {
  launchDefault();
}

function launchTaro() {
  launchDefault();
}

function launchStorybook() {
  launchDefault();
}

function launchReactScripts() {
  const reactScriptsCommandPath = resolveCommandPath({ cwd: projectPath, commandName });
  const reactScriptsMajorVersion = resolveCommandSemVer(reactScriptsCommandPath).major;
  const reactScriptsRegisterPath = require.resolve(
    `../registers/react-scripts__${reactScriptsMajorVersion}.x`
  );

  process.env[EK_REACT_SCRIPTS_SKIP_PREFLIGHT_CHECK] = 'true';
  process.env[EK_INTERNAL_PRE_CONFIG] = require.resolve(
    `../registers/react-scripts__${reactScriptsMajorVersion}.x/pre-config`
  );

  execNode(['-r', reactScriptsRegisterPath, reactScriptsCommandPath, ...args]);
}

function launchRazzle() {
  const razzleCommandPath = resolveCommandPath({ cwd: projectPath, commandName });
  const razzleRegisterPath = require.resolve('../registers/razzle__3.x');
  process.env[EK_INTERNAL_PRE_CONFIG] = require.resolve('../registers/razzle__3.x/pre-config');
  execNode(['-r', razzleRegisterPath, razzleCommandPath, ...args]);
}

function launchTranspile() {
  process.argv[1] = require.resolve('./wuzzle-transpile');
  process.argv.splice(2, 1);
  require('./wuzzle-transpile');
}

async function launchNode() {
  applyNodeLikeExtraOptions('wuzzle-node');
  const nodeRegisterPath = require.resolve('../registers/node');
  execNode(['-r', nodeRegisterPath, ...args]);
}

async function launchMocha() {
  applyNodeLikeExtraOptions('wuzzle-mocha');
  const mochaCommandPath = resolveCommandPath({ cwd: projectPath, commandName });
  const nodeRegisterPath = require.resolve('../registers/node');
  execNode([mochaCommandPath, '-r', nodeRegisterPath, ...args]);
}

function launchJest() {
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
    if (typeof extraProg.inspect == 'string') {
      inspectNodeArgs.splice(
        0,
        inspectNodeArgs.length,
        extraProg.inspect ? `--inspect=${extraProg.inspect}` : '--inspect'
      );
    }

    if (extraProg.inspectBrk === true) {
      extraProg.inspectBrk = '';
    }
    if (typeof extraProg.inspectBrk == 'string') {
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

  const jestCommandPath = resolveCommandPath({ cwd: projectPath, commandName });
  const jestMajorVersion = resolveCommandSemVer(jestCommandPath).major;
  const jestRegisterPath = require.resolve(`../registers/jest__${jestMajorVersion}.x`);

  execNode(['-r', jestRegisterPath, jestCommandPath, ...inspectJestArgs, ...args], {
    nodeArgs: inspectNodeArgs,
  });
}

function launchDefault() {
  let defaultCommandPath: string;
  let webpackMajorVersion: number;
  try {
    defaultCommandPath = resolveCommandPath({ cwd: projectPath, commandName });
    webpackMajorVersion = resolveWebpackSemVer(defaultCommandPath).major;
  } catch {
    console.error(`error: command '${commandName}' not supported.`);
    process.exit(1);
  }
  const webpackRegisterPath = require.resolve(`../registers/webpack__${webpackMajorVersion}.x`);
  execNode(['-r', webpackRegisterPath, defaultCommandPath, ...args]);
}

// Helpers

function execNode(
  execArgs: string[],
  execOpts: execa.SyncOptions & { nodeArgs?: string[] } = {}
): void {
  let execPath = nodePath;
  if ([/node_modules[\\/]ts-node/, /ts-node$/].some(m => m.test(nodePath))) {
    execPath = shelljs.which('node').stdout;
    execArgs.unshift(nodePath);
  }

  try {
    process.env[EK_COMMAND_ARGS] = JSON.stringify(args);
    execa.sync(execPath, [...(execOpts.nodeArgs || []), ...execArgs], {
      stdio: 'inherit',
      ...execOpts,
    });
  } catch (e) {
    console.error(e.stack);
    process.exit(1);
  }
}

/**
 * Parse node like extra options from process args if they exist and store them as an env variable.
 */
function applyNodeLikeExtraOptions(name: string) {
  const options: NodeLikeExtraOptions = { exts: [] };
  const { exts } = options;

  const extraOptions = {
    Ext: '--ext <string>',
    Help: '-H,--Help',
  };

  if (areArgsParsableByFlags({ args, flags: Object.values(extraOptions) })) {
    const extraProg = new Command();

    extraProg
      .option(
        extraOptions.Ext,
        'Specify file extensions for resolving, splitted by comma. ' +
          `(default: "${exts.join(',')}")`
      )
      .helpOption(extraOptions.Help, 'Output usage information.')
      .allowUnknownOption();

    extraProg.parse([nodePath, name, ...args]);

    exts.splice(0, exts.length, ...extraProg.ext.split(','));
    args.splice(0, args.length, ...extraProg.args);
  }

  process.env[EK_NODE_LIKE_EXTRA_OPTIONS] = JSON.stringify(options);
}
