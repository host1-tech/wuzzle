import { Command } from 'commander';
import { EK } from '../constants';
import {
  applyNodeLikeExtraOptions,
  getNodeLikeExtraCommandOpts,
} from './apply-node-like-extra-options';
import { envGetDefault, envSet } from './env-get-set';

jest.mock('./env-get-set', () => ({
  ...jest.requireActual('./env-get-set'),
  envSet: jest.fn(),
}));

jest.spyOn(Command.prototype, 'parse');

describe('getNodeLikeExtraCommandOpts', () => {
  it('works', () => {
    expect(getNodeLikeExtraCommandOpts()).toBeTruthy();
  });
});

describe('applyNodeLikeExtraOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps args and sets default options if no extra arg matched', () => {
    const nodePath = '/path/to/node';
    const name = 'name';
    const oldArgs = ['--version'];
    const newArgs = [...oldArgs];
    applyNodeLikeExtraOptions({ nodePath, name, args: newArgs });
    expect(newArgs).toEqual(oldArgs);
    expect(Command.prototype.parse).not.toBeCalled();
    expect(envSet).toBeCalledWith(
      EK.NODE_LIKE_EXTRA_OPTIONS,
      envGetDefault(EK.NODE_LIKE_EXTRA_OPTIONS)
    );
  });

  it('deletes matched args and sets options with modification if some extra args matched', () => {
    const nodePath = '/path/to/node';
    const name = 'name';
    const oldArgs = ['--ext', '.ts', 'main.ts'];
    const newArgs = [...oldArgs];
    applyNodeLikeExtraOptions({ nodePath, name, args: newArgs });
    expect(newArgs).toEqual(['main.ts']);
    expect(Command.prototype.parse).toBeCalledWith([nodePath, name, ...oldArgs]);
    expect(envSet).toBeCalledWith(EK.NODE_LIKE_EXTRA_OPTIONS, {
      ...envGetDefault(EK.NODE_LIKE_EXTRA_OPTIONS),
      exts: ['.ts'],
    });
  });

  it('works with nodePath omitted', () => {
    const name = 'name';
    const oldArgs = ['--ext', '.ts', 'main.ts'];
    const newArgs = [...oldArgs];
    applyNodeLikeExtraOptions({ name, args: newArgs });
    expect(newArgs).toEqual(['main.ts']);
    expect(Command.prototype.parse).toBeCalledWith([process.argv[0], name, ...oldArgs]);
    expect(envSet).toBeCalledWith(EK.NODE_LIKE_EXTRA_OPTIONS, {
      ...envGetDefault(EK.NODE_LIKE_EXTRA_OPTIONS),
      exts: ['.ts'],
    });
  });
});
