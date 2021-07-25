import { resolveRequire } from '@wuzzle/helpers';
import path from 'path';
import shelljs from 'shelljs';
import { mocked } from 'ts-jest/utils';
import { transform } from './transform';

const transformerPaths: Record<string, string> = {
  posix: '/path/to/transformer',
  win32: 'D:\\path\\to\\transformer',
};

const goodCodes: Record<string, string> = {
  ['26.0.0']: shelljs.cat(path.join(__dirname, 'fixtures/jest-core-build-cli-index@26.0.0.txt'))
    .stdout,
  ['26.6.3']: shelljs.cat(path.join(__dirname, 'fixtures/jest-core-build-cli-index@26.6.3.txt'))
    .stdout,
};

jest.mock('@wuzzle/helpers');

beforeEach(() => {
  jest.clearAllMocks();
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
});
