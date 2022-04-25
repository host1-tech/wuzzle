import { resolveRequire } from '@wuzzle/helpers';
import path from 'path';
import shelljs from 'shelljs';
import { mocked } from 'ts-jest/utils';
import { EK } from '../../constants';
import { transform } from './transform';

const applyConfigPaths: Record<string, string> = {
  posix: '/path/to/apply-config',
  win32: 'D:\\path\\to\\apply-config',
};

const goodCodes: Record<string, string> = {
  ['4.0.0']: shelljs.cat(path.join(__dirname, 'fixtures/webpack-lib-webpack@4.0.0.txt')).stdout,
  ['4.46.0']: shelljs.cat(path.join(__dirname, 'fixtures/webpack-lib-webpack@4.46.0.txt')).stdout,
};

jest.mock('@wuzzle/helpers');

describe('transform', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe.each(Object.keys(goodCodes))('%s', (codeFlag: string) => {
    it.each(Object.keys(applyConfigPaths))('works in %s', (platform: string) => {
      const code = goodCodes[codeFlag];
      const applyConfigPath = applyConfigPaths[platform];
      mocked(resolveRequire).mockReturnValueOnce(applyConfigPath);
      const transformedCode = transform(code);
      expect(transformedCode).toEqual(
        expect.stringContaining(applyConfigPath.replace(/\\/g, '\\\\'))
      );
      expect(transformedCode).toEqual(expect.stringContaining(EK.DRY_RUN));
    });
  });
});
