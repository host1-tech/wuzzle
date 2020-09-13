import { yellow } from 'chalk';
import { Command } from 'commander';
import execa, { ExecaSyncReturnValue } from 'execa';
import findUp from 'find-up';
import path from 'path';
import semver from 'semver';
import createNodeRegister from '../registers/node/create';

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
  const doubleDashIndex = args.indexOf('--');
  const exts = ['.js'];

  if (doubleDashIndex >= 0) {
    const extraArgs = args.slice(doubleDashIndex + 1);
    const extraProg = new Command();

    extraProg
      .option(
        `--ext <string>', 'Specify file extensions for resolving, splitted by comma. ` +
          `(default: "${exts.join(',')}")`
      )
      .helpOption('-h, --help', 'Output usage information.');

    extraProg.parse([nodePath, 'wuzzle-node', ...extraArgs]);

    exts.splice(0, exts.length, ...extraProg.ext.split(','));

    // Clean process args after double dash
    args.splice(doubleDashIndex, args.length - doubleDashIndex);
  }

  const nodeRegisterPath = await createNodeRegister(exts);
  execSync(nodePath, ['-r', nodeRegisterPath, ...args]);
}

// Helpers

function execSync(file: string, args?: string[]): ExecaSyncReturnValue | void {
  try {
    return execa.sync(file, args, { stdio: 'inherit' });
  } catch {
    process.exitCode = 2;
  }
}
