import { logError, logPlain } from '@wuzzle/helpers';
import glob from 'glob';
import { uniqueId } from 'lodash';
import pMap from 'p-map';
import { mocked } from 'ts-jest/utils';
import { getConvertOptions } from '../registers/node/convert-helpers';
import { transpile } from '../transpile';
import {
  getDefaultPreCompileOptions,
  getPreCompileCommandOpts,
  preCompile,
  PreCompileOptions,
  setPreCompileOptionsByCommandProg,
} from './pre-compile';

jest.mock('@wuzzle/helpers');
jest.mock('p-map');
jest.mock('../transpile');

jest.spyOn(glob, 'sync').mockReturnValue([]);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getDefaultPreCompileOptions', () => {
  it('returns values', () => {
    const opts = getDefaultPreCompileOptions();
    expect(opts).toBeTruthy();
    expect(opts.filter(uniqueId())).toBe(true);
  });

  it('overrides', () => {
    const override: Partial<PreCompileOptions> = { verbose: true };
    expect(getDefaultPreCompileOptions(override)).toMatchObject(override);
  });
});

describe('getPreCompileCommandOpts', () => {
  it('works', () => {
    expect(getPreCompileCommandOpts()).toBeTruthy();
  });
});

describe('setPreCompileOptionsByCommandProg', () => {
  it('sets fields if presented in prog', () => {
    const override: Partial<PreCompileOptions> = {
      inputGlobs: [uniqueId(), uniqueId()],
      ignore: [uniqueId(), uniqueId()],
      concurrency: parseInt(uniqueId()),
      follow: true,
      verbose: true,
    };
    const opts = getDefaultPreCompileOptions(override);
    const prog = {
      preCompile: opts.inputGlobs.join(','),
      preCompileIgnore: opts.ignore.join(','),
      preCompileConcurrency: String(opts.concurrency),
      preCompileFollow: opts.follow,
      preCompileVerbose: opts.verbose,
    } as never;
    const output = getDefaultPreCompileOptions();
    setPreCompileOptionsByCommandProg(output, prog);
    expect(output).toMatchObject(override);
  });
});

describe('preCompile', () => {
  it('processes input globs, prints detail, catches error', async () => {
    const inputGlobs = [uniqueId(), uniqueId()];
    await preCompile(getDefaultPreCompileOptions({ inputGlobs }));
    inputGlobs.forEach((inputGlob, i) => {
      const nth = i + 1;
      expect(glob.sync).toHaveBeenNthCalledWith(nth, inputGlob, expect.anything());
    });
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

  it('skips printing detail if no verbose', async () => {
    await preCompile(getDefaultPreCompileOptions({ verbose: false }));
    const preCompileAction = mocked(pMap).mock.calls[0][1];
    const inputPath = uniqueId();
    await preCompileAction(inputPath, 0);
    expect(transpile).toBeCalledWith(getConvertOptions({ inputPath }));
    expect(logPlain).not.toBeCalled();
  });
});
