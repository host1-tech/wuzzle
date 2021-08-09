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

  it('returns empty on unknown command name given', () => {
    process.env[EK_COMMAND_NAME] = 'unknown';
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['test']);
    expect(preConfig()).toEqual(undefined);
  });

  it('returns empty on unknown command args given', () => {
    process.env[EK_COMMAND_NAME] = 'razzle';
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['unknown']);
    expect(preConfig()).toEqual(undefined);
  });

  it(
    'returns testing config w/o babel preset ' +
      'on testing subcommand given and babel config found',
    () => {
      process.env[EK_COMMAND_NAME] = 'razzle';
      process.env[EK_COMMAND_ARGS] = JSON.stringify(['test']);
      cosmiconfigSync$mockedSearch.mockReturnValueOnce({});
      const webpackConfig = preConfig();
      expect(get(webpackConfig, 'module.rules')).toHaveLength(3);
      expect(get(webpackConfig, 'module.rules.0.use.0.options.presets')).toHaveLength(0);
    }
  );

  it(
    'returns testing config with babel preset ' +
      'on testing subcommand given and babel config not found',
    () => {
      process.env[EK_COMMAND_NAME] = 'razzle';
      process.env[EK_COMMAND_ARGS] = JSON.stringify(['test']);
      cosmiconfigSync$mockedSearch.mockReturnValueOnce(null);
      const webpackConfig = preConfig();
      expect(get(webpackConfig, 'module.rules')).toHaveLength(3);
      expect(get(webpackConfig, 'module.rules.0.use.0.options.presets')).toHaveLength(1);
    }
  );
});
