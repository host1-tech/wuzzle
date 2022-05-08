import { logError, logPlain } from '@wuzzle/helpers';
import { Command } from 'commander';
import glob from 'glob';
import { uniqueId } from 'lodash';
import pMap from 'p-map';
import { mocked } from 'ts-jest/utils';
import { EK } from '../constants';
import { getConvertOptions } from '../registers/node/convert-helpers';
import { transpile } from '../transpile';
import {
  applyNodeLikeExtraOptions,
  getNodeLikeExtraCommandOpts,
  NodeLikePreCompileOptions,
} from './apply-node-like-extra-options';
import { envGetDefault, envSet } from './env-get-set';

const name = uniqueId();

jest.mock('@wuzzle/helpers');
jest.mock('p-map');
jest.mock('../transpile');
jest.mock('./env-get-set', () => ({
  ...jest.requireActual('./env-get-set'),
  envSet: jest.fn(),
}));

jest.spyOn(glob, 'sync').mockReturnValue([]);
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

  it('uses default options if no extra arg matched', async () => {
    const nodePath = '/path/to/node';
    const oldArgs = ['--version'];
    const newArgs = [...oldArgs];
    await applyNodeLikeExtraOptions({ nodePath, name, args: newArgs });
    expect(newArgs).toEqual(oldArgs);
    expect(Command.prototype.parse).not.toBeCalled();
    expect(envSet).toBeCalledWith(
      EK.NODE_LIKE_EXTRA_OPTIONS,
      envGetDefault(EK.NODE_LIKE_EXTRA_OPTIONS)
    );
  });

  it('sets options accordingly if any extra args matched', async () => {
    const nodePath = '/path/to/node';
    const oldArgs = ['--ext', '.ts', 'main.ts'];
    const newArgs = [...oldArgs];
    await applyNodeLikeExtraOptions({ nodePath, name, args: newArgs });
    expect(newArgs).toEqual(['main.ts']);
    expect(Command.prototype.parse).toBeCalledWith([nodePath, name, ...oldArgs]);
    expect(envSet).toBeCalledWith(EK.NODE_LIKE_EXTRA_OPTIONS, {
      ...envGetDefault(EK.NODE_LIKE_EXTRA_OPTIONS),
      ext: ['.ts'],
    });
  });

  it('works with nodePath omitted', async () => {
    const oldArgs = ['--ext', '.ts', 'main.ts'];
    const newArgs = [...oldArgs];
    await applyNodeLikeExtraOptions({ name, args: newArgs });
    expect(newArgs).toEqual(['main.ts']);
    expect(Command.prototype.parse).toBeCalledWith([process.argv[0], name, ...oldArgs]);
    expect(envSet).toBeCalledWith(EK.NODE_LIKE_EXTRA_OPTIONS, {
      ...envGetDefault(EK.NODE_LIKE_EXTRA_OPTIONS),
      ext: ['.ts'],
    });
  });

  it(`uses pre-compile options if available`, async () => {
    const preCompileOptions: NodeLikePreCompileOptions = {
      inputGlobs: [uniqueId(), uniqueId()],
      ignore: [uniqueId(), uniqueId()],
      concurrency: +uniqueId(),
      follow: true,
    };
    const args = [
      '--pre-compile',
      preCompileOptions.inputGlobs.join(','),
      '--pre-compile-ignore',
      preCompileOptions.ignore.join(','),
      '--pre-compile-concurrency',
      '' + preCompileOptions.concurrency,
      '--pre-compile-follow',
    ];
    await applyNodeLikeExtraOptions({ name, args });
    preCompileOptions.inputGlobs.forEach((inputGlob, i) => {
      const nth = i + 1;
      expect(glob.sync).toHaveBeenNthCalledWith(
        nth,
        inputGlob,
        expect.objectContaining({
          ignore: preCompileOptions.ignore,
          follow: preCompileOptions.follow,
        })
      );
    });
    expect(pMap).toBeCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        concurrency: preCompileOptions.concurrency,
      })
    );
  });

  it('filters input paths by ext on pre-compiling', async () => {
    const inputPaths = [uniqueId() + '.js'];
    mocked(glob.sync).mockImplementationOnce(() => [...inputPaths, uniqueId() + '.ts']);
    const args = ['--pre-compile', uniqueId()];
    await applyNodeLikeExtraOptions({ name, args });
    expect(pMap).toBeCalledWith(inputPaths, expect.anything(), expect.anything());
  });

  it('handles input paths, catches error, prints detail on pre-compiling', async () => {
    await applyNodeLikeExtraOptions({ name, args: [] });
    const preCompileAction = mocked(pMap).mock.calls[0][1];
    const inputPath = uniqueId();
    await preCompileAction(inputPath, 0);
    expect(transpile).toBeCalledWith(getConvertOptions({ inputPath }));
    expect(logPlain).toBeCalledWith(expect.stringContaining('pre-compiled'));
    const error = uniqueId();
    mocked(transpile).mockRejectedValueOnce(error);
    await preCompileAction(inputPath, 0);
    expect(logPlain).toBeCalledWith(expect.stringContaining('pre-compilation failed'));
    expect(logError).toBeCalledWith(error);
  });

  it('skips printing detail if no verbose on pre-compiling', async () => {
    await applyNodeLikeExtraOptions({ name, args: ['--no-verbose'] });
    const preCompileAction = mocked(pMap).mock.calls[0][1];
    const inputPath = uniqueId();
    await preCompileAction(inputPath, 0);
    expect(transpile).toBeCalledWith(getConvertOptions({ inputPath }));
    expect(logPlain).not.toBeCalled();
  });
});
