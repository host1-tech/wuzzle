import { resolveRequire } from '@wuzzle/helpers';
import { get } from 'lodash';
import { mocked } from 'ts-jest/utils';
import { EK_COMMAND_ARGS, EK_COMMAND_NAME } from '../../constants';
import preConfig from './pre-config';

jest.mock('@wuzzle/helpers');
mocked(resolveRequire).mockReturnValue('');

describe('preConfig.ts', () => {
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
    process.env[EK_COMMAND_NAME] = 'react-scripts';
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['unknown']);
    expect(preConfig({})).toEqual({});
  });

  it('makes changes when applied with proper command envs', () => {
    process.env[EK_COMMAND_NAME] = 'react-scripts';
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['test']);
    const webpackConfig = preConfig({});
    expect(get(webpackConfig, 'module.rules')).toHaveLength(4);
  });
});
