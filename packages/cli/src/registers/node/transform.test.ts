import { logPlain, resolveRequire } from '@wuzzle/helpers';
import fs from 'fs';
import { noop, pick } from 'lodash';
import { addHook } from 'pirates';
import sourceMapSupport from 'source-map-support';
import { mocked } from 'ts-jest/utils';
import { EK_DRY_RUN, EK_PROJECT_PATH, ENCODING_BINARY } from '../../constants';
import { getCurrentNodeLikeExtraOptions, NodeLikeExtraOptions, execNode } from '../../utils';
import { register, transform } from './transform';

const code = `console.log('Hello, world.')`;
const file = '/path/to/code';
const convertPath = '/path/to/convert';

process.env[EK_PROJECT_PATH] = process.cwd();

jest.mock('@wuzzle/helpers');
jest.mock('pirates');
jest.mock('source-map-support');
jest.mock('../../utils');

jest.spyOn(fs, 'readFileSync').mockReturnValue(code);
mocked(execNode).mockReturnValue({} as never);
jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});
jest.spyOn(process.stderr, 'write').mockImplementation(noop as never);

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env[EK_DRY_RUN];
});

describe('register', () => {
  it('extends options', () => {
    const nodeLikeExtraOptions: NodeLikeExtraOptions = { verbose: false, exts: ['.es'] };
    mocked(getCurrentNodeLikeExtraOptions).mockReturnValueOnce(nodeLikeExtraOptions);
    register();
    expect(sourceMapSupport.install).toBeCalled();
    expect(mocked(addHook)).toBeCalledWith(
      transform,
      expect.objectContaining(pick(nodeLikeExtraOptions, ['exts']))
    );
  });

  it('prints config info and terminates process in dry-run mode', () => {
    process.env[EK_DRY_RUN] = 'true';
    try {
      register();
    } catch {}
    expect(execNode).toBeCalled();
    expect(process.exit).toBeCalled();
  });
});

describe('transform', () => {
  it('converts code', () => {
    mocked(getCurrentNodeLikeExtraOptions).mockReturnValueOnce({ verbose: false, exts: [] });
    mocked(resolveRequire).mockReturnValueOnce(convertPath);
    transform(code, file);
    expect(fs.readFileSync).toBeCalledWith(file, ENCODING_BINARY);
    expect(resolveRequire).toBeCalled();
    expect(execNode).toBeCalledWith({
      execArgs: [convertPath, file, ENCODING_BINARY],
      execOpts: { input: code, stdout: 'pipe' },
    });
  });

  it('prints detail', () => {
    mocked(getCurrentNodeLikeExtraOptions).mockReturnValueOnce({ verbose: true, exts: [] });
    mocked(resolveRequire).mockReturnValueOnce(convertPath);
    transform(code, file);
    expect(logPlain).toBeCalledWith(expect.stringContaining('compiled'));
  });
});
