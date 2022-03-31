import { resolveRequire } from '@wuzzle/helpers';
import { get } from 'lodash';
import { mocked } from 'ts-jest/utils';
import { getWuzzleModifyOptions, WuzzleModifyOptions } from '../../apply-config';
import preConfig from './pre-config';

const wuzzleModifyOptions: WuzzleModifyOptions = {
  ...getWuzzleModifyOptions(),
  commandName: 'razzle',
  commandArgs: ['test'],
};

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
    expect(preConfig(0, 0, { ...wuzzleModifyOptions, commandName: 'unknown' })).toBeUndefined();
  });

  it('returns empty on unknown command args given', () => {
    expect(preConfig(0, 0, { ...wuzzleModifyOptions, commandArgs: ['unknown'] })).toBeUndefined();
  });

  it(
    'returns testing config w/o babel preset ' +
      'on testing subcommand given and babel config found',
    () => {
      cosmiconfigSync$mockedSearch.mockReturnValueOnce({});
      const webpackConfig = preConfig(0, 0, wuzzleModifyOptions);
      expect(get(webpackConfig, 'module.rules')).toHaveLength(3);
      expect(get(webpackConfig, 'module.rules.0.use.0.options.presets')).toHaveLength(0);
    }
  );

  it(
    'returns testing config with babel preset ' +
      'on testing subcommand given and babel config not found',
    () => {
      cosmiconfigSync$mockedSearch.mockReturnValueOnce(null);
      const webpackConfig = preConfig(0, 0, wuzzleModifyOptions);
      expect(get(webpackConfig, 'module.rules')).toHaveLength(3);
      expect(get(webpackConfig, 'module.rules.0.use.0.options.presets')).toHaveLength(1);
    }
  );
});
