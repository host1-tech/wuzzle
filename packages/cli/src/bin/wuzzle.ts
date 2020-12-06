import { Command } from 'commander';
import execa from 'execa';
import findUp from 'find-up';
import path from 'path';
import semver from 'semver';
import shelljs from 'shelljs';
import {
  EK_COMMAND_ARGS,
  EK_COMMAND_NAME,
  EK_INTERNAL_PRE_CONFIG,
  EK_NODE_LIKE_EXTRA_OPTIONS,
  EK_RPOJECT_ANCHOR,
} from '../constants';
import type { NodeLikeExtraOptions } from '../registers/node';

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

  case 'react-scripts':
    launchReactScripts();
    break;

  case 'electron-webpack':
    launchElectronWebpack();
    break;

  case 'next':
    launchNext();
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

  case 'taro':
    launchTaro();
    break;

  case 'razzle':
    launchRazzle();
    break;

  default:
    if (commandName) {
      console.error(`error: command '${commandName}' not supported.`);
    } else {
      console.error('error: command name not specified.');
    }
    process.exit(1);
}

// Entries

function launchWebpack() {
  const { bin, version } = require(path.resolve(projectPath, 'node_modules/webpack/package.json'));
  const majorVersion = semver.parse(version)!.major;

  const webpackCommandPath = path.resolve(projectPath, 'node_modules/webpack', bin);
  const webpackRegisterPath = require.resolve(`../registers/webpack__${majorVersion}.x`);

  execNode(['-r', webpackRegisterPath, webpackCommandPath, ...args]);
}

function launchReactScripts() {
  const { bin } = require(path.resolve(projectPath, 'node_modules/react-scripts/package.json'));

  const reactScriptsCommandPath = path.resolve(
    projectPath,
    'node_modules/react-scripts',
    bin['react-scripts']
  );

  const reactScriptsRegisterPath = require.resolve('../registers/react-scripts__3.x');
  execNode(['-r', reactScriptsRegisterPath, reactScriptsCommandPath, ...args]);
}

function launchElectronWebpack() {
  const { bin } = require(path.resolve(projectPath, 'node_modules/electron-webpack/package.json'));

  const electronWebpackCommandPath = path.resolve(
    projectPath,
    'node_modules/electron-webpack',
    bin['electron-webpack']
  );
  const webpackRegisterPath = require.resolve('../registers/webpack__4.x');

  execNode(['-r', webpackRegisterPath, electronWebpackCommandPath, ...args]);
}

function launchNext() {
  const { bin } = require(path.resolve(projectPath, 'node_modules/next/package.json'));

  const nextCommandPath = path.resolve(projectPath, 'node_modules/next', bin['next']);
  const webpackRegisterPath = require.resolve('../registers/webpack__4.x');

  execNode(['-r', webpackRegisterPath, nextCommandPath, ...args]);
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

  const { bin } = require(path.resolve(projectPath, 'node_modules/mocha/package.json'));

  const mochaCommandPath = path.resolve(projectPath, 'node_modules/mocha', bin['mocha']);
  const nodeRegisterPath = require.resolve('../registers/node');

  execNode([mochaCommandPath, '-r', nodeRegisterPath, ...args]);
}

function launchJest() {
  const inspectNodeArgs: string[] = [];
  const inspectJestArgs: string[] = [];

  const extraOptions = {
    Inspect: '--inspect',
    InspectBrk: '--inspect-brk',
    Help: '-H,--help',
  };

  if (willParseExtraOptions(extraOptions)) {
    const extraProg = new Command();

    extraProg
      .option(`${extraOptions.Inspect} [string]`, 'activate inspector')
      .option(
        `${extraOptions.InspectBrk} [string]`,
        'activate inspector and break at start of user scrip'
      )
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

  const { bin, version } = require(path.resolve(projectPath, 'node_modules/jest/package.json'));
  const majorVersion = semver.parse(version)!.major;

  const jestCommandPath = path.resolve(
    projectPath,
    'node_modules/jest',
    majorVersion >= 25 ? bin : bin['jest']
  );
  const jestRegisterPath = require.resolve(`../registers/jest__${majorVersion}.x`);

  execNode(['-r', jestRegisterPath, jestCommandPath, ...inspectJestArgs, ...args], {
    nodeArgs: inspectNodeArgs,
  });
}

function launchTaro() {
  const { bin } = require(path.resolve(projectPath, 'node_modules/@tarojs/cli/package.json'));

  const taroCommandPath = path.resolve(projectPath, 'node_modules/@tarojs/cli', bin['taro']);
  const webpackRegisterPath = require.resolve('../registers/webpack__4.x');

  execNode(['-r', webpackRegisterPath, taroCommandPath, ...args]);
}

function launchRazzle() {
  const { bin } = require(path.resolve(projectPath, 'node_modules/razzle/package.json'));

  const razzleCommandPath = path.resolve(projectPath, 'node_modules/razzle', bin['razzle']);
  const razzleRegisterPath = require.resolve('../registers/razzle__3.x');

  process.env[EK_INTERNAL_PRE_CONFIG] = require.resolve('../registers/razzle__3.x/pre-config');

  execNode(['-r', razzleRegisterPath, razzleCommandPath, ...args]);
}

// Helpers

function execNode(
  execArgs: string[],
  execOpts: execa.SyncOptions & { nodeArgs?: string[] } = {}
): void {
  let execPath = nodePath;
  if (nodePath.match(/ts-node$/)) {
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
    Ext: '--ext',
    Help: '-H,--Help',
  };

  if (willParseExtraOptions(extraOptions)) {
    const extraProg = new Command();

    extraProg
      .option(
        `${extraOptions.Ext} <string>`,
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

/**
 * Check whether to parse extra options or not by `extraOptions`.
 */
function willParseExtraOptions(extraOptions: Record<string, string>) {
  return Object.values(extraOptions).some(option =>
    args.some(arg => option.split(',').some(o => arg == o || arg.startsWith(`${o}=`)))
  );
}
