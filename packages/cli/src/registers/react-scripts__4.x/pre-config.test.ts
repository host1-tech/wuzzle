import findUp from 'find-up';
import { get } from 'lodash';
import path from 'path';
import shelljs from 'shelljs';
import type webpack from 'webpack';
import {
  EK_COMMAND_ARGS,
  EK_COMMAND_NAME,
  EK_REACT_SCRIPTS_DISABLE_NEW_JSX_TRANSFORM,
} from '../../constants';
import type preConfig from './pre-config';

type PreConfig = typeof preConfig;

const projectPath = path.dirname(findUp.sync('package.json', { cwd: __filename })!);
const fixturePaths = {
  '4.x': path.resolve(projectPath, '__tests__/fixtures/react-scripts__4.x'),
  '3.x': path.resolve(projectPath, '__tests__/fixtures/react-scripts__3.x'),
};

describe('react-scripts__4.x/pre-config.ts', () => {
  beforeAll(() => shelljs.cd(fixturePaths['4.x']));

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

  it('makes changes when applied with proper command envs and new jsx runtime found', () => {
    process.env[EK_COMMAND_NAME] = 'react-scripts';
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['test']);
    const webpackConfig = evaluateWebpackConfig();
    expect(get(webpackConfig, 'module.rules')).toHaveLength(2);
    expect(get(webpackConfig, 'module.rules.0.use.0.options.presets.0.1.runtime')).toBe(
      'automatic'
    );
  });

  it('makes changes when applied with proper command envs and jsx runtime not found', () => {
    process.env[EK_COMMAND_NAME] = 'react-scripts';
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['test']);
    shelljs.cd(fixturePaths['3.x']);
    const webpackConfig = evaluateWebpackConfig();
    shelljs.cd(fixturePaths['4.x']);
    expect(get(webpackConfig, 'module.rules')).toHaveLength(2);
    expect(get(webpackConfig, 'module.rules.0.use.0.options.presets.0.1.runtime')).toBe('classic');
  });

  it('makes changes when applied with proper command envs and jsx runtime disabled', () => {
    process.env[EK_COMMAND_NAME] = 'react-scripts';
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['test']);
    process.env[EK_REACT_SCRIPTS_DISABLE_NEW_JSX_TRANSFORM] = 'true';
    const webpackConfig = evaluateWebpackConfig();
    expect(get(webpackConfig, 'module.rules')).toHaveLength(2);
    expect(get(webpackConfig, 'module.rules.0.use.0.options.presets.0.1.runtime')).toBe('classic');
  });
});

function evaluateWebpackConfig() {
  const iWebpackConfig: webpack.Configuration = {};
  let preConfig: PreConfig = jest.fn();
  jest.isolateModules(() => (preConfig = require('./pre-config').default));
  const oWebpackConfig = preConfig(iWebpackConfig);
  return Object.assign({}, iWebpackConfig, oWebpackConfig);
}
