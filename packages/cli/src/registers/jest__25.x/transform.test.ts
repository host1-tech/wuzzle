import { backupWithRestore, resolveRequire, tryRestoreWithRemove } from '@wuzzle/helpers';
import fs from 'fs';
import { noop } from 'lodash';
import os from 'os';
import path from 'path';
import shelljs from 'shelljs';
import { mocked } from 'ts-jest/utils';
import { EK_DRY_RUN } from '../../constants';
import { transform as transformNode } from '../node/transform';
import * as transformModule from './transform';
import { register, transform } from './transform';

const matchedModulePath = '/path/to/matched/module';

const transformerPaths: Record<string, string> = {
  posix: '/path/to/transformer',
  win32: 'D:\\path\\to\\transformer',
};

const goodCodes: Record<string, string> = {
  ['25.0.0']: shelljs.cat(path.join(__dirname, 'fixtures/jest-core-build-cli-index@25.0.0.txt'))
    .stdout,
  ['25.5.4']: shelljs.cat(path.join(__dirname, 'fixtures/jest-core-build-cli-index@25.5.4.txt'))
    .stdout,
};

const flawCodes: Record<string, string> = {
  ['no-config']: shelljs.cat(path.join(__dirname, 'fixtures/flaw-no-configs.txt')).stdout,
};

jest.mock('@wuzzle/helpers');
jest.mock('pirates');
jest.mock('../node/transform');

jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});
jest.spyOn(process.stderr, 'write').mockImplementation(noop as never);

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env[EK_DRY_RUN];
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
  });

  it('recovers the matched on unregistered', () => {
    transformModule.unregister({ commandPath: '' });
    expect(tryRestoreWithRemove).toBeCalledWith(matchedModulePath);
  });

  it(
    'calls node transform to print config info and ' +
      'terminates process if registering in dry-run mode',
    () => {
      process.env[EK_DRY_RUN] = 'true';
      try {
        register({ commandPath: '' });
      } catch {}
      expect(transformNode).toBeCalled();
      expect(process.stderr.write).toBeCalledWith(os.EOL);
      expect(process.exit).toBeCalled();
    }
  );
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
