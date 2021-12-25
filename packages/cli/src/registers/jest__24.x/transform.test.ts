import { backupWithRestore, resolveRequire, tryRestoreWithRemove } from '@wuzzle/helpers';
import fs from 'fs';
import path from 'path';
import shelljs from 'shelljs';
import { mocked } from 'ts-jest/utils';
import { EK_DRY_RUN } from '../../constants';
import { printDryRunLog } from '../node/transform';
import * as transformModule from './transform';
import { register, transform, unregister } from './transform';

const commandPath = '/path/to/command';
const matchedModulePath = '/path/to/matched/module';

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
jest.mock('../node/transform');

jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});

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
    register({ commandPath });
    expect(backupWithRestore).toBeCalledWith(matchedModulePath);
  });

  it('recovers the matched on unregistered', () => {
    unregister({ commandPath });
    expect(tryRestoreWithRemove).toBeCalledWith(matchedModulePath);
  });

  it('throws error if no module path matched in registering', () => {
    mocked(resolveRequire).mockImplementation(() => {
      throw 0;
    });
    let error: any;
    try {
      register({ commandPath });
    } catch (e) {
      error = e;
    }
    expect(error.message).toEqual(expect.stringContaining(commandPath));
  });

  it('prints config info and terminates process if registering in dry-run mode', () => {
    process.env[EK_DRY_RUN] = 'true';
    try {
      register({ commandPath });
    } catch {}
    expect(printDryRunLog).toBeCalled();
    expect(process.exit).toBeCalled();
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
