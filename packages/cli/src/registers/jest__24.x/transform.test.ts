import { resolveRequire } from '@wuzzle/helpers';
import path from 'path';
import { addHook } from 'pirates';
import shelljs from 'shelljs';
import { mocked } from 'ts-jest/utils';
import { register, transform } from './transform';

const matchingPaths = [
  'node_modules/jest-cli/build/cli/index.js',
  'node_modules/@jest/core/build/cli/index.js',
];

const transformerPaths: Record<string, string> = {
  posix: '/path/to/transformer',
  win32: 'D:\\path\\to\\transformer',
};

const goodCodes: Record<string, string> = {
  ['24.0.0']: shelljs.cat(path.join(__dirname, 'fixtures/jest-cli-build-cli-index@24.0.0.txt'))
    .stdout,
  ['24.9.0']: shelljs.cat(path.join(__dirname, 'fixtures/jest-core-build-cli-index@24.9.0.txt'))
    .stdout,
};

const flawCodes: Record<string, string> = {
  ['no-config']: shelljs.cat(path.join(__dirname, 'fixtures/flaw-no-configs.txt')).stdout,
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
    it.each(Object.keys(transformerPaths))('works in %s', (platform: string) => {
      const code = goodCodes[codeFlag];
      const transformerPath = transformerPaths[platform];
      mocked(resolveRequire).mockReturnValueOnce(transformerPath);
      const transformedCode = transform(code);
      expect(transformedCode).toEqual(
        expect.stringContaining(transformerPath.replace(/\\/g, '\\\\'))
      );
    });
  });

  it.each(Object.keys(flawCodes))('breaks with %s', (codeFlag: string) => {
    const code = flawCodes[codeFlag];
    const transformerPath = transformerPaths['posix'];
    mocked(resolveRequire).mockReturnValueOnce(transformerPath);
    const transformedCode = transform(code);
    expect(transformedCode).toEqual(expect.not.stringContaining(transformerPath));
  });
});
