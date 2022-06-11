import { mocked } from 'ts-jest/utils';

import { resolveRequire } from '@wuzzle/helpers';

import { getWuzzleModifyOptions, WuzzleModifyOptions } from '../../apply-config';
import preConfig from './pre-config';

const wuzzleModifyOptions: WuzzleModifyOptions = {
  ...getWuzzleModifyOptions(),
  commandName: 'jest',
};

jest.mock('@wuzzle/helpers');
mocked(resolveRequire).mockReturnValue('');

describe('preConfig', () => {
  it('returns empty on unknown command name given', () => {
    expect(preConfig(0, 0, { ...wuzzleModifyOptions, commandName: 'unknown' })).toBeUndefined();
  });

  it('returns preset config on jest command given', () => {
    expect(preConfig(0, 0, wuzzleModifyOptions)).toBeTruthy();
  });
});
