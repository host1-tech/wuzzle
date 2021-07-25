import { resolveRequire } from '@wuzzle/helpers';
import execa from 'execa';
import { noop } from 'lodash';
import { addHook } from 'pirates';
import sourceMapSupport from 'source-map-support';
import { mocked } from 'ts-jest/utils';
import { EK_NODE_LIKE_EXTRA_OPTIONS } from '../../constants';
import { register, transform } from './transform';

const code = `console.log('Hello, world.')`;
const file = '/path/to/code';
const convertPath = '/path/to/convert';

jest.mock('@wuzzle/helpers');
jest.mock('pirates');
jest.mock('source-map-support');
jest.spyOn(execa, 'sync').mockReturnValue({} as never);
jest.spyOn(process.stderr, 'write').mockImplementation(noop as never);

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env[EK_NODE_LIKE_EXTRA_OPTIONS];
});

describe('register', () => {
  it('extends options', () => {
    const options = { exts: ['.es'], more: 'future usage' };
    process.env[EK_NODE_LIKE_EXTRA_OPTIONS] = JSON.stringify(options);
    register();
    expect(sourceMapSupport.install).toBeCalled();
    expect(mocked(addHook).mock.calls[0][1]?.exts).toEqual(expect.arrayContaining(options.exts));
  });
});

describe('transform', () => {
  it('works', () => {
    mocked(resolveRequire).mockReturnValueOnce(convertPath);
    transform(code, file);
    expect(resolveRequire).toBeCalled();
    const [, args, opts] = mocked(execa.sync).mock.calls[0] as unknown[];
    expect(args).toEqual(expect.arrayContaining([convertPath, file]));
    expect(opts).toMatchObject({ input: code });
    expect(process.stderr.write).toBeCalled();
  });
});
