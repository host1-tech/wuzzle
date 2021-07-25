import { resolveRequire } from '@wuzzle/helpers';
import path from 'path';
import { addHook } from 'pirates';
import shelljs from 'shelljs';
import { mocked } from 'ts-jest/utils';
import { register, transform } from './transform';

const matchingPaths = ['node_modules/webpack/lib/webpack.js'];

const applyConfigPaths: Record<string, string> = {
  posix: '/path/to/apply-config',
  win32: 'D:\\path\\to\\apply-config',
};

const goodCodes: Record<string, string> = {
  ['4.0.0']: shelljs.cat(path.join(__dirname, 'fixtures/webpack-lib-webpack@4.0.0.txt')).stdout,
  ['4.46.0']: shelljs.cat(path.join(__dirname, 'fixtures/webpack-lib-webpack@4.46.0.txt')).stdout,
};

jest.mock('@wuzzle/helpers');
jest.mock('pirates');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('register', () => {
  it('matches paths', () => {
    register();
    const matcher = mocked(addHook).mock.calls[0][1]!.matcher!;
    expect(matcher).toBeTruthy();
    matchingPaths.map(p => {
      expect(matcher(path.posix.normalize(p))).toBe(true);
      expect(matcher(path.win32.normalize(p))).toBe(true);
    });
  });
});

describe('transform', () => {
  describe.each(Object.keys(goodCodes))('%s', (codeFlag: string) => {
    it.each(Object.keys(applyConfigPaths))('works in %s', (platform: string) => {
      const code = goodCodes[codeFlag];
      const applyConfigPath = applyConfigPaths[platform];
      mocked(resolveRequire).mockReturnValueOnce(applyConfigPath);
      const transformedCode = transform(code);
      expect(transformedCode).toEqual(
        expect.stringContaining(applyConfigPath.replace(/\\/g, '\\\\'))
      );
    });
  });
});
