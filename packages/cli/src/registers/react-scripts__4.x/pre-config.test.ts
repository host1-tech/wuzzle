import { resolveRequire } from '@wuzzle/helpers';
import { get } from 'lodash';
import { mocked } from 'ts-jest/utils';
import { EK_REACT_SCRIPTS_DISABLE_NEW_JSX_TRANSFORM } from '../../constants';
import preConfig from './pre-config';

jest.mock('@wuzzle/helpers');

describe('preConfig.ts', () => {
  beforeEach(() => {
    mocked(resolveRequire).mockReturnValue('');
  });

  it('returns empty on unknown command name given', () => {
    const commandName = 'unknown';
    const commandArgs = ['test'];
    expect(preConfig(0, 0, { commandName, commandArgs })).toEqual(undefined);
  });

  it('returns empty on unknown command args given', () => {
    const commandName = 'react-scripts';
    const commandArgs = ['unknown'];
    expect(preConfig(0, 0, { commandName, commandArgs })).toEqual(undefined);
  });

  it(
    'returns testing config with jsx runtime enabled ' +
      'on testing subcommand given and found new jsx runtime',
    () => {
      const commandName = 'react-scripts';
      const commandArgs = ['test'];
      const webpackConfig = preConfig(0, 0, { commandName, commandArgs });
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
      const commandName = 'react-scripts';
      const commandArgs = ['test'];
      mocked(resolveRequire).mockImplementation(p => {
        if (p.endsWith('react/jsx-runtime')) {
          throw 0;
        }
        return '';
      });
      const webpackConfig = preConfig(0, 0, { commandName, commandArgs });
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
      const commandName = 'react-scripts';
      const commandArgs = ['test'];
      process.env[EK_REACT_SCRIPTS_DISABLE_NEW_JSX_TRANSFORM] = 'true';
      const webpackConfig = preConfig(0, 0, { commandName, commandArgs });
      expect(get(webpackConfig, 'module.rules')).toHaveLength(4);
      expect(get(webpackConfig, 'module.rules.0.use.0.options.presets.0.1.runtime')).toBe(
        'classic'
      );
    }
  );
});
