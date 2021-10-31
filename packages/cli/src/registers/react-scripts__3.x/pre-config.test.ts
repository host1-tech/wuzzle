import { resolveRequire } from '@wuzzle/helpers';
import { get } from 'lodash';
import { mocked } from 'ts-jest/utils';
import preConfig from './pre-config';

jest.mock('@wuzzle/helpers');
mocked(resolveRequire).mockReturnValue('');

describe('preConfig.ts', () => {
  it('returns empty on unknown command name given', () => {
    const commandName = 'unknown';
    const commandArgs = ['test'];
    expect(preConfig(0, 0, { commandName, commandArgs })).toBe(undefined);
  });

  it('returns empty on unknown command args given', () => {
    const commandName = 'react-scripts';
    const commandArgs = ['unknown'];
    expect(preConfig(0, 0, { commandName, commandArgs })).toBe(undefined);
  });

  it('returns testing config on testing subcommand given', () => {
    const commandName = 'react-scripts';
    const commandArgs = ['test'];
    const webpackConfig = preConfig(0, 0, { commandName, commandArgs });
    expect(get(webpackConfig, 'module.rules')).toHaveLength(4);
  });
});
