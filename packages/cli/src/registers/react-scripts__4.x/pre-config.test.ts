import { get } from 'lodash';
import { mocked } from 'ts-jest/utils';

import { resolveRequire } from '@wuzzle/helpers';

import { getWuzzleModifyOptions, WuzzleModifyOptions } from '../../apply-config';
import { envGet } from '../../utils';
import preConfig from './pre-config';

const wuzzleModifyOptions: WuzzleModifyOptions = {
  ...getWuzzleModifyOptions(),
  commandName: 'react-scripts',
  commandArgs: ['test'],
};

jest.mock('@wuzzle/helpers');
jest.mock('../../utils');

describe('preConfig.ts', () => {
  beforeEach(() => {
    mocked(resolveRequire).mockReturnValue('');
  });

  it('returns empty on unknown command name given', () => {
    expect(preConfig(0, 0, { ...wuzzleModifyOptions, commandName: 'unknown' })).toBeUndefined();
  });

  it('returns empty on unknown command args given', () => {
    expect(preConfig(0, 0, { ...wuzzleModifyOptions, commandArgs: ['unknown'] })).toBeUndefined();
  });

  it(
    'returns testing config with jsx runtime enabled ' +
      'on testing subcommand given and found new jsx runtime',
    () => {
      const webpackConfig = preConfig(0, 0, wuzzleModifyOptions);
      expect(get(webpackConfig, 'module.rules')).toHaveLength(4);
      expect(get(webpackConfig, 'module.rules.0.use.0.options.presets.0.1.runtime')).toBe(
        'automatic'
      );
    }
  );

  it(
    'returns testing config with jsx runtime disabled ' +
      'on testing subcommand given and jsx runtime not found',
    () => {
      mocked(resolveRequire).mockImplementation(p => {
        if (p.endsWith('react/jsx-runtime')) {
          throw 0;
        }
        return '';
      });
      const webpackConfig = preConfig(0, 0, wuzzleModifyOptions);
      expect(get(webpackConfig, 'module.rules')).toHaveLength(4);
      expect(get(webpackConfig, 'module.rules.0.use.0.options.presets.0.1.runtime')).toBe(
        'classic'
      );
    }
  );

  it(
    'returns testing config with jsx runtime disabled ' +
      'on testing subcommand given and jsx runtime disabled',
    () => {
      mocked(envGet).mockReturnValueOnce('true');
      const webpackConfig = preConfig(0, 0, wuzzleModifyOptions);
      expect(get(webpackConfig, 'module.rules')).toHaveLength(4);
      expect(get(webpackConfig, 'module.rules.0.use.0.options.presets.0.1.runtime')).toBe(
        'classic'
      );
    }
  );
});
