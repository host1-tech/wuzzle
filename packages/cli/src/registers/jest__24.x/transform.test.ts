import { resolveRequire } from '@wuzzle/helpers';
import path from 'path';
import shelljs from 'shelljs';
import { mocked } from 'ts-jest/utils';
import { getCurrentJestExtraOptions } from '../../utils';
import { transform } from './transform';

const goodCodes: Record<string, string> = {
  ['24.0.0']: shelljs.cat(path.join(__dirname, 'fixtures/jest-cli-build-cli-index@24.0.0.txt'))
    .stdout,
  ['24.9.0']: shelljs.cat(path.join(__dirname, 'fixtures/jest-core-build-cli-index@24.9.0.txt'))
    .stdout,
};

const flawCodes: Record<string, string> = {
  ['no-config']: shelljs.cat(path.join(__dirname, 'fixtures/flaw-no-configs.txt')).stdout,
};

const alteredTransformerPaths: Record<string, string> = {
  posix: '/path/to/altered-transformer',
  win32: 'D:\\path\\to\\altered-transformer',
};

const applyConfigPaths: Record<string, string> = {
  posix: '/path/to/apply-config',
  win32: 'D:\\path\\to\\apply-config',
};

const nodeTransformPaths: Record<string, string> = {
  posix: '/path/to/node/transform',
  win32: 'D:\\path\\to\\node\\transform',
};

const resolvedPaths: Record<string, Record<string, string>> = {
  './altered-transformer': alteredTransformerPaths,
  '../../apply-config': applyConfigPaths,
  '../node/transform': nodeTransformPaths,
};

jest.mock('@wuzzle/helpers');
jest.mock('../../utils', () => {
  return { ...jest.requireActual('../../utils'), getCurrentJestExtraOptions: jest.fn() };
});

jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});

mocked(getCurrentJestExtraOptions).mockReturnValue({ webpack: true });

describe('transform', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocked(resolveRequire).mockReset();
  });

  describe.each(Object.keys(goodCodes))('%s', (codeFlag: string) => {
    it.each(['posix', 'win32'])('works in %s', (platform: string) => {
      mocked(resolveRequire).mockImplementation(id => resolvedPaths[id][platform]);
      const code = goodCodes[codeFlag];
      const transformedCode = transform(code);
      [alteredTransformerPaths, applyConfigPaths, nodeTransformPaths].forEach(paths =>
        expect(transformedCode).toEqual(
          expect.stringContaining(paths[platform].replace(/\\/g, '\\\\'))
        )
      );
    });
  });

  it('skips webpack specific handling if specified', () => {
    mocked(getCurrentJestExtraOptions).mockReturnValueOnce({ webpack: false });
    const codeFlag = '24.0.0';
    const platform = 'posix';
    mocked(resolveRequire).mockImplementation(id => resolvedPaths[id][platform]);
    const code = goodCodes[codeFlag];
    const transformedCode = transform(code);
    [applyConfigPaths].forEach(paths =>
      expect(transformedCode).toEqual(expect.stringContaining(paths[platform]))
    );
    [alteredTransformerPaths, nodeTransformPaths].forEach(paths =>
      expect(transformedCode).toEqual(expect.not.stringContaining(paths[platform]))
    );
  });

  it.each(Object.keys(flawCodes))('breaks with %s', (codeFlag: string) => {
    const platform = 'posix';
    mocked(resolveRequire).mockImplementation(id => resolvedPaths[id][platform]);
    const code = flawCodes[codeFlag];
    const transformedCode = transform(code);
    [alteredTransformerPaths, applyConfigPaths, nodeTransformPaths].forEach(paths =>
      expect(transformedCode).toEqual(expect.not.stringContaining(paths[platform]))
    );
  });
});
