import { resolveRequire } from '@wuzzle/helpers';
import { get } from 'lodash';
import { mocked } from 'ts-jest/utils';
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
  it('returns empty on unknown command name given', () => {
    const commandName = 'unknown';
    const commandArgs = ['test'];
    expect(preConfig(0, 0, { commandName, commandArgs })).toEqual(undefined);
  });

  it('returns empty on unknown command args given', () => {
    const commandName = 'razzle';
    const commandArgs = ['unknown'];
    expect(preConfig(0, 0, { commandName, commandArgs })).toEqual(undefined);
  });

  it(
    'returns testing config w/o babel preset ' +
      'on testing subcommand given and babel config found',
    () => {
      cosmiconfigSync$mockedSearch.mockReturnValueOnce({});
      const commandName = 'razzle';
      const commandArgs = ['test'];
      const webpackConfig = preConfig(0, 0, { commandName, commandArgs });
      expect(get(webpackConfig, 'module.rules')).toHaveLength(3);
      expect(get(webpackConfig, 'module.rules.0.use.0.options.presets')).toHaveLength(0);
    }
  );

  it(
    'returns testing config with babel preset ' +
      'on testing subcommand given and babel config not found',
    () => {
      cosmiconfigSync$mockedSearch.mockReturnValueOnce(null);
      const commandName = 'razzle';
      const commandArgs = ['test'];
      const webpackConfig = preConfig(0, 0, { commandName, commandArgs });
      expect(get(webpackConfig, 'module.rules')).toHaveLength(3);
      expect(get(webpackConfig, 'module.rules.0.use.0.options.presets')).toHaveLength(1);
    }
  );
});
