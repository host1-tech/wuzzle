import { resolveRequire } from '@wuzzle/helpers';
import execa from 'execa';
import { noop } from 'lodash';
import { addHook } from 'pirates';
import sourceMapSupport from 'source-map-support';
import { mocked } from 'ts-jest/utils';
import { EK_DRY_RUN } from '../../constants';
import { getCurrentNodeLikeExtraOptions, NodeLikeExtraOptions } from '../../utils';
import { register, transform } from './transform';

const code = `console.log('Hello, world.')`;
const file = '/path/to/code';
const convertPath = '/path/to/convert';

jest.mock('@wuzzle/helpers');
jest.mock('pirates');
jest.mock('source-map-support');
jest.mock('../../utils');

jest.spyOn(execa, 'sync').mockReturnValue({} as never);
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
    const nodeLikeExtraOptions: NodeLikeExtraOptions = { exts: ['.es'] };
    mocked(getCurrentNodeLikeExtraOptions).mockReturnValueOnce(nodeLikeExtraOptions);
    register();
    expect(sourceMapSupport.install).toBeCalled();
    expect(mocked(addHook)).toBeCalledWith(
      transform,
      expect.objectContaining(nodeLikeExtraOptions)
    );
  });

  it('prints config info and terminates process in dry-run mode', () => {
    process.env[EK_DRY_RUN] = 'true';
    try {
      register();
    } catch {}
    expect(execa.sync).toBeCalled();
    expect(process.exit).toBeCalled();
  });
});

describe('transform', () => {
  it('works', () => {
    mocked(resolveRequire).mockReturnValueOnce(convertPath);
    transform(code, file);
    expect(resolveRequire).toBeCalled();
    const [, args, opts] = mocked(execa.sync).mock.calls[0] as unknown[];
    expect(args).toEqual(expect.arrayContaining([convertPath, file]));
    expect(opts).toMatchObject({ input: code, stderr: 'inherit' });
  });
});
