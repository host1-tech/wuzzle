import { resolveRequire } from '@wuzzle/helpers';
import { get } from 'lodash';
import { mocked } from 'ts-jest/utils';
import {
  EK_COMMAND_ARGS,
  EK_COMMAND_NAME,
  EK_REACT_SCRIPTS_DISABLE_NEW_JSX_TRANSFORM,
} from '../../constants';
import preConfig from './pre-config';

jest.mock('@wuzzle/helpers');

describe('preConfig.ts', () => {
  beforeEach(() => {
    delete process.env[EK_COMMAND_NAME];
    delete process.env[EK_COMMAND_ARGS];
    mocked(resolveRequire).mockReturnValue('');
  });

  it('keeps unchanged when applied with unknown command name', () => {
    process.env[EK_COMMAND_NAME] = 'unknown';
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['test']);
    expect(preConfig({})).toEqual({});
  });

  it('keeps unchanged when applied with unknown command args', () => {
    process.env[EK_COMMAND_NAME] = 'react-scripts';
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['unknown']);
    expect(preConfig({})).toEqual({});
  });

  it('makes changes when applied with proper command envs and new jsx runtime found', () => {
    process.env[EK_COMMAND_NAME] = 'react-scripts';
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['test']);
    const webpackConfig = preConfig({});
    expect(get(webpackConfig, 'module.rules')).toHaveLength(4);
    expect(get(webpackConfig, 'module.rules.0.use.0.options.presets.0.1.runtime')).toBe(
      'automatic'
    );
  });

  it('makes changes when applied with proper command envs and jsx runtime not found', () => {
    process.env[EK_COMMAND_NAME] = 'react-scripts';
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['test']);
    mocked(resolveRequire).mockImplementation(p => {
      if (p.endsWith('react/jsx-runtime')) {
        throw 0;
      }
      return '';
    });
    const webpackConfig = preConfig({});
    expect(get(webpackConfig, 'module.rules')).toHaveLength(4);
    expect(get(webpackConfig, 'module.rules.0.use.0.options.presets.0.1.runtime')).toBe('classic');
  });

  it('makes changes when applied with proper command envs and jsx runtime disabled', () => {
    process.env[EK_COMMAND_NAME] = 'react-scripts';
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['test']);
    process.env[EK_REACT_SCRIPTS_DISABLE_NEW_JSX_TRANSFORM] = 'true';
    const webpackConfig = preConfig({});
    expect(get(webpackConfig, 'module.rules')).toHaveLength(4);
    expect(get(webpackConfig, 'module.rules.0.use.0.options.presets.0.1.runtime')).toBe('classic');
  });
});
