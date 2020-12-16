import findUp from 'find-up';
import { get } from 'lodash';
import path from 'path';
import shelljs from 'shelljs';
import type webpack from 'webpack';
import { EK_COMMAND_ARGS, EK_COMMAND_NAME } from '../../constants';
import type preConfig from './pre-config';

type PreConfig = typeof preConfig;

const projectPath = path.dirname(findUp.sync('package.json', { cwd: __filename })!);
const fixturePath = path.resolve(projectPath, '__tests__/fixtures/react-scripts__3.x');

describe('react-scripts__3.x/pre-config.ts', () => {
  beforeAll(() => shelljs.cd(fixturePath));

  it('keeps unchanged when applied with unknown command name', () => {
    process.env[EK_COMMAND_NAME] = 'unknown';
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['test']);
    expect(evaluateWebpackConfig()).toEqual({});
  });

  it('keeps unchanged when applied with unknown command args', () => {
    process.env[EK_COMMAND_NAME] = 'react-scripts';
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['unknown']);
    expect(evaluateWebpackConfig()).toEqual({});
  });

  it('makes changes when applied with proper command envs', () => {
    process.env[EK_COMMAND_NAME] = 'react-scripts';
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['test']);
    const webpackConfig = evaluateWebpackConfig();
    expect(get(webpackConfig, 'module.rules')).toHaveLength(4);
  });
});

function evaluateWebpackConfig() {
  const iWebpackConfig: webpack.Configuration = {};
  let preConfig: PreConfig = jest.fn();
  jest.isolateModules(() => (preConfig = require('./pre-config').default));
  const oWebpackConfig = preConfig(iWebpackConfig);
  return Object.assign({}, iWebpackConfig, oWebpackConfig);
}
