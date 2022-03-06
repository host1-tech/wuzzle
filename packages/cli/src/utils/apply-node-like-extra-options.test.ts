import { Command } from 'commander';
import { EK_NODE_LIKE_EXTRA_OPTIONS } from '../constants';
import {
  applyNodeLikeExtraOptions,
  getCurrentNodeLikeExtraOptions,
  getDefaultNodeLikeExtraOptions,
  getNodeLikeExtraCommandOpts,
  NodeLikeExtraOptions,
} from './apply-node-like-extra-options';

jest.spyOn(Command.prototype, 'parse');

describe('getDefaultNodeLikeExtraOptions', () => {
  it('works', () => {
    expect(getDefaultNodeLikeExtraOptions()).toBeTruthy();
  });
});

describe('getCurrentNodeLikeExtraOptions', () => {
  beforeEach(() => {
    delete process.env[EK_NODE_LIKE_EXTRA_OPTIONS];
  });

  it('works', () => {
    const nodeLikeExtraOptions: Partial<NodeLikeExtraOptions> = {
      exts: ['.ts'],
    };
    process.env[EK_NODE_LIKE_EXTRA_OPTIONS] = JSON.stringify(nodeLikeExtraOptions);
    expect(getCurrentNodeLikeExtraOptions()).toEqual({
      ...getDefaultNodeLikeExtraOptions(),
      exts: ['.js', '.ts'],
    });
  });
});

describe('getNodeLikeExtraCommandOpts', () => {
  it('works', () => {
    expect(getNodeLikeExtraCommandOpts()).toBeTruthy();
  });
});

describe('applyNodeLikeExtraOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env[EK_NODE_LIKE_EXTRA_OPTIONS];
  });

  it('keeps args and sets default options if no extra arg matched', () => {
    const nodePath = '/path/to/node';
    const name = 'name';
    const oldArgs = ['--version'];
    const newArgs = [...oldArgs];
    applyNodeLikeExtraOptions({ nodePath, name, args: newArgs });
    expect(newArgs).toEqual(oldArgs);
    expect(Command.prototype.parse).toBeCalledTimes(0);
    expect(process.env[EK_NODE_LIKE_EXTRA_OPTIONS]).toEqual(
      JSON.stringify(getDefaultNodeLikeExtraOptions())
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
    expect(process.env[EK_NODE_LIKE_EXTRA_OPTIONS]).toEqual(
      JSON.stringify({ ...getDefaultNodeLikeExtraOptions(), exts: ['.ts'] })
    );
  });

  it('works with nodePath omitted', () => {
    const name = 'name';
    const oldArgs = ['--ext', '.ts', 'main.ts'];
    const newArgs = [...oldArgs];
    applyNodeLikeExtraOptions({ name, args: newArgs });
    expect(newArgs).toEqual(['main.ts']);
    expect(Command.prototype.parse).toBeCalledWith([process.argv[0], name, ...oldArgs]);
    expect(process.env[EK_NODE_LIKE_EXTRA_OPTIONS]).toEqual(
      JSON.stringify({ ...getDefaultNodeLikeExtraOptions(), exts: ['.ts'] })
    );
  });
});
