import { get } from 'lodash';
import { mocked } from 'ts-jest/utils';

import { resolveRequire } from '@wuzzle/helpers';

import { getWuzzleModifyOptions, WuzzleModifyOptions } from '../../apply-config';
import preConfig from './pre-config';

const wuzzleModifyOptions: WuzzleModifyOptions = {
  ...getWuzzleModifyOptions(),
  commandName: 'react-scripts',
  commandArgs: ['test'],
};

jest.mock('@wuzzle/helpers');
mocked(resolveRequire).mockReturnValue('');

describe('preConfig.ts', () => {
  it('returns empty on unknown command name given', () => {
    expect(preConfig(0, 0, { ...wuzzleModifyOptions, commandName: 'unknown' })).toBeUndefined();
  });

  it('returns empty on unknown command args given', () => {
    expect(preConfig(0, 0, { ...wuzzleModifyOptions, commandArgs: ['unknown'] })).toBeUndefined();
  });

  it('returns testing config on testing subcommand given', () => {
    const webpackConfig = preConfig(0, 0, wuzzleModifyOptions);
    expect(get(webpackConfig, 'module.rules')).toHaveLength(4);
  });
});
