import { red, yellow } from 'chalk';
import { Command } from 'commander';
import execa, { ExecaSyncReturnValue } from 'execa';
import findUp from 'find-up';
import path from 'path';
import semver from 'semver';
import { NodeLikeExtraOptions, NODE_LIKE_EXTRA_OPTIONS_ENV_KEY } from '../registers/node/utils';

const packageJsonPath = findUp.sync('package.json');

if (!packageJsonPath) {
  console.log(red('error: package.json not located.'));
  process.exit(1);
}

const projectPath = path.dirname(packageJsonPath);

const [nodePath, , commandName, ...args] = process.argv;

// Set command name as an env variable to help wuzzle user config setup
process.env.WUZZLE_COMMAND_NAME = commandName;

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
      console.log(yellow(`error: command '${commandName}' not supported.`));
    } else {
      console.log(yellow('error: command name not specified.'));
    }
    process.exit(1);
}

// Entries

function launchWebpack() {
  const { bin, version } = require(path.resolve(projectPath, 'node_modules/webpack/package.json'));
  const majorVersion = semver.parse(version)?.major || 4;

  const webpackCommandPath = path.resolve(projectPath, 'node_modules/webpack', bin);
  const webpackRegisterPath = require.resolve(`../registers/webpack__${majorVersion}.x`);

  execSync(nodePath, ['-r', webpackRegisterPath, webpackCommandPath, ...args]);
}

function launchReactScripts() {
  const { bin } = require(path.resolve(projectPath, 'node_modules/react-scripts/package.json'));

  const reactScriptsCommandPath = path.resolve(
    projectPath,
    'node_modules/react-scripts',
    bin['react-scripts']
  );

  const reactScriptsRegisterPath = require.resolve('../registers/react-scripts__3.x');
  execSync(nodePath, ['-r', reactScriptsRegisterPath, reactScriptsCommandPath, ...args]);
}

function launchElectronWebpack() {
  const { bin } = require(path.resolve(projectPath, 'node_modules/electron-webpack/package.json'));

  const electronWebpackCommandPath = path.resolve(
    projectPath,
    'node_modules/electron-webpack',
    bin['electron-webpack']
  );
  const webpackRegisterPath = require.resolve('../registers/webpack__4.x');

  execSync(nodePath, ['-r', webpackRegisterPath, electronWebpackCommandPath, ...args]);
}

function launchNext() {
  const { bin } = require(path.resolve(projectPath, 'node_modules/next/package.json'));

  const nextCommandPath = path.resolve(projectPath, 'node_modules/next', bin['next']);
  const webpackRegisterPath = require.resolve('../registers/webpack__4.x');

  execSync(nodePath, ['-r', webpackRegisterPath, nextCommandPath, ...args]);
}

function launchTranspile() {
  process.argv[1] = require.resolve('./wuzzle-transpile');
  process.argv.splice(2, 1);
  require('./wuzzle-transpile');
}

async function launchNode() {
  applyNodeLikeExtraOptions('wuzzle-node');
  const nodeRegisterPath = require.resolve('../registers/node');
  execSync(nodePath, ['-r', nodeRegisterPath, ...args]);
}

async function launchMocha() {
  applyNodeLikeExtraOptions('wuzzle-node');

  const { bin } = require(path.resolve(projectPath, 'node_modules/mocha/package.json'));

  const mochaCommandPath = path.resolve(projectPath, 'node_modules/mocha', bin['mocha']);
  const nodeRegisterPath = require.resolve('../registers/node');

  execSync(nodePath, [mochaCommandPath, '-r', nodeRegisterPath, ...args]);
}

function launchJest() {
  const { bin, version } = require(path.resolve(projectPath, 'node_modules/jest/package.json'));
  const majorVersion = semver.parse(version)?.major || 26;

  const jestCommandPath = path.resolve(
    projectPath,
    'node_modules/jest',
    majorVersion >= 25 ? bin : bin['jest']
  );
  const jestRegisterPath = require.resolve(`../registers/jest__${majorVersion}.x`);

  execSync(nodePath, ['-r', jestRegisterPath, jestCommandPath, ...args]);
}

function launchTaro() {
  const { bin } = require(path.resolve(projectPath, 'node_modules/@tarojs/cli/package.json'));

  const taroCommandPath = path.resolve(projectPath, 'node_modules/@tarojs/cli', bin['taro']);
  const webpackRegisterPath = require.resolve('../registers/webpack__4.x');

  execSync(nodePath, ['-r', webpackRegisterPath, taroCommandPath, ...args]);
}

function launchRazzle() {
  const { bin } = require(path.resolve(projectPath, 'node_modules/razzle/package.json'));

  const razzleCommandPath = path.resolve(projectPath, 'node_modules/razzle', bin['razzle']);
  const razzleRegisterPath = require.resolve('../registers/razzle__3.x');

  execSync(nodePath, ['-r', razzleRegisterPath, razzleCommandPath, ...args]);
}

// Helpers

function execSync(file: string, args?: string[]): ExecaSyncReturnValue | void {
  try {
    return execa.sync(file, args, { stdio: 'inherit' });
  } catch {
    process.exit(2);
  }
}

/**
 * Parse extra options from process args if they exist and store them as an env variable.
 */
function applyNodeLikeExtraOptions(name: string) {
  const options: NodeLikeExtraOptions = { exts: [] };
  const { exts } = options;

  const extraOptions = {
    Ext: '--ext',
    Help: '-H,--Help',
  };

  const willParseExtraOptions = Object.values(extraOptions).some(option =>
    args.some(arg => option.split(',').includes(arg))
  );

  if (willParseExtraOptions) {
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

  process.env[NODE_LIKE_EXTRA_OPTIONS_ENV_KEY] = JSON.stringify(options);
}
