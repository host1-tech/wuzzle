import { yellow } from 'chalk';
import { Command } from 'commander';
import execa, { ExecaSyncReturnValue } from 'execa';
import findUp from 'find-up';
import path from 'path';
import semver from 'semver';
import { NodeLikeExtraOptions } from '../registers/node/types';

const packageJsonPath = findUp.sync('package.json');

if (!packageJsonPath) {
  throw new Error('Cannot resolve location of package.');
}

const projectPath = path.dirname(packageJsonPath);

const [nodePath, , commandName, ...args] = process.argv;

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

  default:
    console.log(yellow(`Command '${commandName}' not supported yet.`));
    break;
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
  const { bin } = require(path.resolve(projectPath, 'node_modules/jest/package.json'));

  const jestCommandPath = path.resolve(projectPath, 'node_modules/jest', bin);
  const jestRegisterPath = require.resolve('../registers/jest__26.x');

  execSync(nodePath, ['-r', jestRegisterPath, jestCommandPath, ...args]);
}

function launchTaro() {
  const { bin } = require(path.resolve(projectPath, 'node_modules/@tarojs/cli/package.json'));

  const taroCommandPath = path.resolve(projectPath, 'node_modules/@tarojs/cli', bin['taro']);
  const webpackRegisterPath = require.resolve('../registers/webpack__4.x');

  execSync(nodePath, ['-r', webpackRegisterPath, taroCommandPath, ...args]);
}

// Helpers

function execSync(file: string, args?: string[]): ExecaSyncReturnValue | void {
  try {
    return execa.sync(file, args, { stdio: 'inherit' });
  } catch {
    process.exitCode = 2;
  }
}

/**
 * Parse extra options from process args if they exist. The param `options` is input for
 * controls and default values. And it is also output for holding results values. In the
 * end, the param `options` is returned.
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

  process.env.WUZZLE_NODE_LIKE_EXTRA_OPTIONS = JSON.stringify(options);
}
