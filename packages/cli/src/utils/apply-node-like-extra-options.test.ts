import { Command } from 'commander';
import { uniqueId } from 'lodash';
import { mocked } from 'ts-jest/utils';

import { EK } from '../constants';
import {
  applyNodeLikeExtraOptions,
  getNodeLikeExtraCommandOpts,
} from './apply-node-like-extra-options';
import { envGetDefault, envSet } from './env-get-set';
import { preCompile, setPreCompileOptionsByCommandProg } from './pre-compile';

const name = uniqueId();

jest.mock('./env-get-set', () => ({
  ...jest.requireActual('./env-get-set'),
  envSet: jest.fn(),
}));
jest.mock('./pre-compile', () => ({
  ...jest.requireActual('./pre-compile'),
  setPreCompileOptionsByCommandProg: jest.fn(),
  preCompile: jest.fn(),
}));

jest.spyOn(Command.prototype, 'parse');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getNodeLikeExtraCommandOpts', () => {
  it('works', () => {
    expect(getNodeLikeExtraCommandOpts()).toBeTruthy();
  });
});

describe('applyNodeLikeExtraOptions', () => {
  it('uses default options if no extra arg matched', () => {
    const nodePath = '/path/to/node';
    const oldArgs = ['--version'];
    const newArgs = [...oldArgs];
    applyNodeLikeExtraOptions({ nodePath, name, args: newArgs });
    expect(newArgs).toEqual(oldArgs);
    expect(Command.prototype.parse).not.toBeCalled();
    expect(setPreCompileOptionsByCommandProg).not.toBeCalled();
    expect(envSet).toBeCalledWith(
      EK.NODE_LIKE_EXTRA_OPTIONS,
      envGetDefault(EK.NODE_LIKE_EXTRA_OPTIONS)
    );
  });

  it('uses modified options if any extra args matched', () => {
    const nodePath = '/path/to/node';
    const oldArgs = ['--ext', '.ts', 'main.ts'];
    const newArgs = [...oldArgs];
    applyNodeLikeExtraOptions({ nodePath, name, args: newArgs });
    expect(newArgs).toEqual(['main.ts']);
    expect(Command.prototype.parse).toBeCalledWith([nodePath, name, ...oldArgs]);
    expect(setPreCompileOptionsByCommandProg).toBeCalled();
    expect(envSet).toBeCalledWith(
      EK.NODE_LIKE_EXTRA_OPTIONS,
      expect.objectContaining({ ext: ['.ts'] })
    );
  });

  it('works with nodePath omitted', () => {
    const args = ['--ext', '.ts', 'main.ts'];
    applyNodeLikeExtraOptions({ name, args: [...args] });
    expect(Command.prototype.parse).toBeCalledWith([process.argv[0], name, ...args]);
  });

  it('applies pre-compilation', async () => {
    const { applyPreCompilation } = applyNodeLikeExtraOptions({ name, args: [] });
    await applyPreCompilation();
    expect(preCompile).toBeCalled();
    const { filter } = mocked(preCompile).mock.calls[0][0];
    expect(filter('a.js')).toBe(true);
    expect(filter('a.unmatched')).toBe(false);
  });
});
