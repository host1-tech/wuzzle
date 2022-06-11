import { addHook } from 'pirates';
import sourceMapSupport from 'source-map-support';
import { mocked } from 'ts-jest/utils';

import { logPlain, resolveRequire } from '@wuzzle/helpers';

import { CONFIG_FILENAME, EK } from '../../constants';
import { transpileSyncFromCacheOnly } from '../../transpile';
import { envGet, envGetDefault, execNode } from '../../utils';
import { getConvertOptions } from './convert-helpers';
import { register, transform } from './transform';

const projectPath = '/path/to/project';
const code = `console.log('Hello, world.')`;
const file = '/path/to/code';
const convertPath = '/path/to/convert';

jest.mock('@wuzzle/helpers');
jest.mock('pirates');
jest.mock('source-map-support');
jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  envGet: jest.fn(),
  execNode: jest.fn(),
}));
jest.mock('../../transpile');

mocked(execNode).mockReturnValue({} as never);
mocked(resolveRequire).mockReturnValue(convertPath);
jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});

const envGetProjectPath = jest.fn(envGet).mockReturnValue(projectPath);
const envGetDryRun = jest.fn(envGet).mockReturnValue(envGetDefault(EK.DRY_RUN));
const envGetNodeLikeExtraOptions = jest
  .fn(envGet)
  .mockReturnValue(envGetDefault(EK.NODE_LIKE_EXTRA_OPTIONS));
mocked(envGet).mockImplementation(ek => {
  if (ek === EK.DRY_RUN) {
    return envGetDryRun(ek);
  } else if (ek === EK.NODE_LIKE_EXTRA_OPTIONS) {
    return envGetNodeLikeExtraOptions(ek);
  } else if (ek === EK.PROJECT_PATH) {
    return envGetProjectPath(ek);
  }
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('register', () => {
  it('sets hooks', () => {
    const ext = ['.es'];
    envGetNodeLikeExtraOptions.mockReturnValueOnce({ ext });
    register();
    expect(sourceMapSupport.install).toBeCalled();
    const piratesOptions = mocked(addHook).mock.calls[0][1]!;
    expect(piratesOptions).toEqual({
      ext,
      matcher: expect.any(Function),
      ignoreNodeModules: true,
    });
    const matcher = piratesOptions.matcher!;
    expect(matcher(`${projectPath}/a.js`)).toBe(true);
    expect(matcher(`${projectPath}/${CONFIG_FILENAME}`)).toBe(false);
    expect(matcher('/path/to/somewhere/else')).toBe(false);
  });

  it('prints config info and terminates process in dry-run mode', () => {
    envGetDryRun.mockReturnValueOnce('true');
    try {
      register();
    } catch {}
    expect(execNode).toBeCalled();
    expect(process.exit).toBeCalled();
  });
});

describe('transform', () => {
  it('does not compile if found in cache', () => {
    envGetNodeLikeExtraOptions.mockReturnValueOnce({ verbose: false });
    transform(code, file);
    expect(transpileSyncFromCacheOnly).toBeCalledWith(getConvertOptions({ inputPath: file }));
    expect(execNode).not.toBeCalled();
  });

  it('compiles if not found in cache', () => {
    envGetNodeLikeExtraOptions.mockReturnValueOnce({ verbose: false });
    mocked(transpileSyncFromCacheOnly).mockImplementationOnce(() => {
      throw 0;
    });
    transform(code, file);
    expect(transpileSyncFromCacheOnly).toBeCalledWith(getConvertOptions({ inputPath: file }));
    expect(execNode).toBeCalledWith({
      execArgs: [convertPath],
      execOpts: expect.objectContaining({
        input: JSON.stringify(getConvertOptions({ inputPath: file })),
      }),
    });
  });

  it('prints detail if verbose', () => {
    envGetNodeLikeExtraOptions.mockReturnValueOnce({ verbose: true });
    transform(code, file);
    expect(logPlain).toHaveBeenLastCalledWith(expect.stringContaining('from cache'));

    mocked(transpileSyncFromCacheOnly).mockImplementationOnce(() => {
      throw 0;
    });
    envGetNodeLikeExtraOptions.mockReturnValueOnce({ verbose: true });
    transform(code, file);
    expect(logPlain).toHaveBeenLastCalledWith(expect.stringContaining('compiled'));
  });
});
