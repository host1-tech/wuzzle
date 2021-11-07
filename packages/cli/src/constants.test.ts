import findCacheDir from 'find-cache-dir';
import os from 'os';
import path from 'path';
import { mocked } from 'ts-jest/utils';

jest.mock('find-cache-dir');
jest.spyOn(os, 'tmpdir');

describe('constants', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('CACHE_BASE_PATH returns path under node_modules if node_modules presented', () => {
    const cachePath = '/path/to/cacahe';
    mocked(findCacheDir).mockReturnValueOnce(cachePath);
    const constants: Record<string, unknown> = {};
    jest.isolateModules(() => Object.assign(constants, require('./constants')));
    expect(findCacheDir).toBeCalledWith({ name: constants.PKG_NAME });
    expect(constants.CACHE_BASE_PATH).toBe(cachePath);
  });

  it('CACHE_BASE_PATH returns path under OS tmpdir if node_modules absent', () => {
    const tmpdirPath = '/path/to/tmpdir';
    mocked(os.tmpdir).mockReturnValueOnce(tmpdirPath);
    mocked(findCacheDir).mockReturnValueOnce(undefined);
    const constants: Record<string, unknown> = {};
    jest.isolateModules(() => Object.assign(constants, require('./constants')));
    const cachePath = path.join(tmpdirPath, constants.PKG_NAME as string);
    expect(constants.CACHE_BASE_PATH).toBe(cachePath);
  });
});
