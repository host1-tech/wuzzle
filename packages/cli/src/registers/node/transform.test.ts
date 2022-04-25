import { logPlain, resolveRequire } from '@wuzzle/helpers';
import fs from 'fs';
import { pick } from 'lodash';
import { addHook } from 'pirates';
import sourceMapSupport from 'source-map-support';
import { mocked } from 'ts-jest/utils';
import { EK, ENCODING_BINARY } from '../../constants';
import { envGet, envGetDefault, execNode, NodeLikeExtraOptions } from '../../utils';
import { register, transform } from './transform';

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

jest.spyOn(fs, 'readFileSync').mockReturnValue(code);
mocked(execNode).mockReturnValue({} as never);
jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});

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
    return '/path/to/project';
  }
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('register', () => {
  it('extends options', () => {
    const nodeLikeExtraOptions: NodeLikeExtraOptions = { verbose: false, exts: ['.es'] };
    envGetNodeLikeExtraOptions.mockReturnValueOnce(nodeLikeExtraOptions);
    register();
    expect(sourceMapSupport.install).toBeCalled();
    expect(mocked(addHook)).toBeCalledWith(
      transform,
      expect.objectContaining(pick(nodeLikeExtraOptions, ['exts']))
    );
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
  it('converts code', () => {
    envGetNodeLikeExtraOptions.mockReturnValueOnce({ verbose: false, exts: [] });
    mocked(resolveRequire).mockReturnValueOnce(convertPath);
    transform(code, file);
    expect(fs.readFileSync).toBeCalledWith(file, ENCODING_BINARY);
    expect(resolveRequire).toBeCalled();
    expect(execNode).toBeCalledWith({
      execArgs: [convertPath, file, ENCODING_BINARY],
      execOpts: { input: code, stdin: 'pipe', stdout: 'pipe' },
    });
  });

  it('prints detail', () => {
    envGetNodeLikeExtraOptions.mockReturnValueOnce({ verbose: true, exts: [] });
    mocked(resolveRequire).mockReturnValueOnce(convertPath);
    transform(code, file);
    expect(logPlain).toBeCalledWith(expect.stringContaining('compiled'));
  });
});
