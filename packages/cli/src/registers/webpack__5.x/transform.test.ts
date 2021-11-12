import { backupWithRestore, resolveRequire, tryRestoreWithRemove } from '@wuzzle/helpers';
import fs from 'fs';
import path from 'path';
import shelljs from 'shelljs';
import { mocked } from 'ts-jest/utils';
import { EK_DRY_RUN } from '../../constants';
import * as transformModule from './transform';
import { register, transform, unregister } from './transform';

const matchedModulePath = '/path/to/matched/module';

const applyConfigPaths: Record<string, string> = {
  posix: '/path/to/apply-config',
  win32: 'D:\\path\\to\\apply-config',
};

const goodCodes: Record<string, string> = {
  ['5.0.0']: shelljs.cat(path.join(__dirname, 'fixtures/webpack-lib-webpack@5.0.0.txt')).stdout,
  ['5.45.1']: shelljs.cat(path.join(__dirname, 'fixtures/webpack-lib-webpack@5.45.1.txt')).stdout,
};

const flawCodes: Record<string, string> = {
  ['no-create-compiler']: shelljs.cat(path.join(__dirname, 'fixtures/flaw-no-create-compiler.txt'))
    .stdout,
};

jest.mock('@wuzzle/helpers');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('register/unregister', () => {
  beforeAll(() => {
    jest.spyOn(fs, 'readFileSync').mockReturnValue('');
    jest.spyOn(fs, 'writeFileSync').mockReturnValue();
    jest.spyOn(transformModule, 'transform').mockReturnValue('');
    mocked(resolveRequire).mockReturnValue(matchedModulePath);
  });

  afterAll(() => {
    mocked(fs.readFileSync).mockRestore();
    mocked(fs.writeFileSync).mockRestore();
    mocked(transform).mockRestore();
    mocked(resolveRequire).mockRestore();
  });

  it('transforms the matched on registered', () => {
    register({ commandPath: '' });
    expect(backupWithRestore).toBeCalledWith(matchedModulePath);
    expect(mocked(fs.readFileSync).mock.calls[0][0]).toBe(matchedModulePath);
    expect(mocked(fs.writeFileSync).mock.calls[0][0]).toBe(matchedModulePath);
  });

  it('recovers the matched on unregistered', () => {
    unregister({ commandPath: '' });
    expect(tryRestoreWithRemove).toBeCalledWith(matchedModulePath);
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
      expect(transformedCode).toEqual(expect.stringContaining(EK_DRY_RUN));
    });
  });

  it.each(Object.keys(flawCodes))('breaks with %s', (codeFlag: string) => {
    const code = flawCodes[codeFlag];
    const applyConfigPath = applyConfigPaths['posix'];
    mocked(resolveRequire).mockReturnValueOnce(applyConfigPath);
    const transformedCode = transform(code);
    expect(transformedCode).toEqual(expect.not.stringContaining(applyConfigPath));
  });
});
