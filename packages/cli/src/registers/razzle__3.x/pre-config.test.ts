import { resolveRequire } from '@wuzzle/helpers';
import { get } from 'lodash';
import { mocked } from 'ts-jest/utils';
import { EK_COMMAND_ARGS, EK_COMMAND_NAME } from '../../constants';
import preConfig from './pre-config';

let cosmiconfigSync$mockedSearch: jest.Mock;
jest.mock('cosmiconfig', () => {
  cosmiconfigSync$mockedSearch = jest.fn();
  return {
    cosmiconfigSync: () => ({
      search: cosmiconfigSync$mockedSearch,
    }),
  };
});
jest.mock('@wuzzle/helpers');
mocked(resolveRequire).mockReturnValue('');

describe('preConfig', () => {
  beforeEach(() => {
    delete process.env[EK_COMMAND_NAME];
    delete process.env[EK_COMMAND_ARGS];
  });

  it('keeps unchanged when applied with unknown command name', () => {
    process.env[EK_COMMAND_NAME] = 'unknown';
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['test']);
    expect(preConfig({})).toEqual({});
  });

  it('keeps unchanged when applied with unknown command args', () => {
    process.env[EK_COMMAND_NAME] = 'razzle';
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['unknown']);
    expect(preConfig({})).toEqual({});
  });

  it('makes changes when applied with proper command envs and babel config found', () => {
    process.env[EK_COMMAND_NAME] = 'razzle';
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['test']);
    cosmiconfigSync$mockedSearch.mockReturnValueOnce({});
    const webpackConfig = preConfig({});
    expect(get(webpackConfig, 'module.rules')).toHaveLength(3);
    expect(get(webpackConfig, 'module.rules.0.use.0.options.presets')).toHaveLength(0);
  });

  it('makes changes when applied with proper command envs and no babel config found', () => {
    process.env[EK_COMMAND_NAME] = 'razzle';
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['test']);
    cosmiconfigSync$mockedSearch.mockReturnValueOnce(null);
    const webpackConfig = preConfig({});
    expect(get(webpackConfig, 'module.rules')).toHaveLength(3);
    expect(get(webpackConfig, 'module.rules.0.use.0.options.presets')).toHaveLength(1);
  });
});
