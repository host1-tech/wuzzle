import shelljs from 'shelljs';
import findUp from 'find-up';
import path from 'path';
import { yellow } from 'chalk';
import semver from 'semver';

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

  default:
    console.log(yellow(`Command '${commandName}' not supported yet.`));
    break;
}

function launchWebpack() {
  const { bin, version } = require(path.resolve(projectPath, 'node_modules/webpack/package.json'));
  const majorVersion = semver.parse(version)?.major || 4;

  const webpackCommandPath = path.resolve(projectPath, 'node_modules/webpack', bin);
  const webpackRegisterPath = require.resolve(`../registers/webpack__${majorVersion}.x`);
  shelljs.exec(`${nodePath} -r ${webpackRegisterPath} ${webpackCommandPath} ${args.join(' ')}`);
}

function launchReactScripts() {
  const { bin } = require(path.resolve(projectPath, 'node_modules/react-scripts/package.json'));

  const reactScriptsCommandPath = path.resolve(
    projectPath,
    'node_modules/react-scripts',
    bin['react-scripts']
  );

  const reactScriptsRegisterPath = require.resolve(`../registers/react-scripts__3.x`);

  shelljs.exec(
    `${nodePath} -r ${reactScriptsRegisterPath} ${reactScriptsCommandPath} ${args.join(' ')}`
  );
}

function launchElectronWebpack() {
  const { bin } = require(path.resolve(projectPath, 'node_modules/electron-webpack/package.json'));

  const electronWebpackCommandPath = path.resolve(
    projectPath,
    'node_modules/electron-webpack',
    bin['electron-webpack']
  );
  const webpackRegisterPath = require.resolve(`../registers/webpack__4.x`);

  shelljs.exec(
    `${nodePath} -r ${webpackRegisterPath} ${electronWebpackCommandPath} ${args.join(' ')}`
  );
}

function launchNext() {
  const { bin } = require(path.resolve(projectPath, 'node_modules/next/package.json'));

  const nextCommandPath = path.resolve(projectPath, 'node_modules/next', bin['next']);
  const webpackRegisterPath = require.resolve(`../registers/webpack__4.x`);

  shelljs.exec(`${nodePath} -r ${webpackRegisterPath} ${nextCommandPath} ${args.join(' ')}`);
}
