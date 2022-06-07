import { Command } from 'commander';
import { uniqueId } from 'lodash';
import { mocked } from 'ts-jest/utils';
import { EK } from '../constants';
import { applyJestExtraOptions, getJestExtraCommandOpts } from './apply-jest-extra-options';
import { envGet, envGetDefault, envSet } from './env-get-set';
import { preCompile, setPreCompileOptionsByCommandProg } from './pre-compile';

const name = uniqueId();

jest.mock('./env-get-set', () => ({
  ...jest.requireActual('./env-get-set'),
  envGet: jest.fn(),
  envSet: jest.fn(),
}));
jest.mock('./pre-compile', () => ({
  ...jest.requireActual('./pre-compile'),
  setPreCompileOptionsByCommandProg: jest.fn(),
  preCompile: jest.fn(),
}));

jest.spyOn(Command.prototype, 'parse');
mocked(envGet).mockReturnValue('test');

describe('getJestExtraCommandOpts', () => {
  it('works', () => expect(getJestExtraCommandOpts()).toBeTruthy());
});

describe('applyJestExtraOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses default options if not matched', () => {
    const nodePath = '/path/to/node';
    const oldArgs = ['--version'];
    const newArgs = [...oldArgs];
    applyJestExtraOptions({ nodePath, name, args: newArgs });
    expect(newArgs).toEqual(oldArgs);
    expect(Command.prototype.parse).not.toBeCalled();
    expect(setPreCompileOptionsByCommandProg).not.toBeCalled();
    expect(envSet).toBeCalledWith(EK.JEST_EXTRA_OPTIONS, envGetDefault(EK.JEST_EXTRA_OPTIONS));
  });

  it('uses updated options if any matched', () => {
    const nodePath = '/path/to/node';
    const oldArgs1 = ['--no-webpack', 'main.test.js'];
    const newArgs1 = [...oldArgs1];
    applyJestExtraOptions({ nodePath, name, args: newArgs1 });
    expect(newArgs1).toEqual(['main.test.js']);
    expect(Command.prototype.parse).toBeCalledWith([nodePath, name, ...oldArgs1]);
    expect(setPreCompileOptionsByCommandProg).not.toBeCalled();
    expect(envSet).toBeCalledWith(
      EK.JEST_EXTRA_OPTIONS,
      expect.objectContaining({ webpack: false })
    );

    const oldArgs2 = ['--pre-compile', '*.js', 'main.test.js'];
    const newArgs2 = [...oldArgs2];
    applyJestExtraOptions({ nodePath, name, args: newArgs2 });
    expect(newArgs2).toEqual(['main.test.js']);
    expect(Command.prototype.parse).toBeCalledWith([nodePath, name, ...oldArgs2]);
    expect(setPreCompileOptionsByCommandProg).toBeCalled();
    expect(envSet).toBeCalledWith(EK.JEST_EXTRA_OPTIONS, envGetDefault(EK.JEST_EXTRA_OPTIONS));
  });

  it('works with nodePath omitted', () => {
    const args = ['--no-webpack', 'main.test.js'];
    applyJestExtraOptions({ name, args: [...args] });
    expect(Command.prototype.parse).toBeCalledWith([process.argv[0], name, ...args]);
  });

  it('sets NODE_ENV if absent', () => {
    mocked(envGet).mockReturnValueOnce(undefined);
    applyJestExtraOptions({ name, args: [] });
    expect(envSet).toBeCalledWith('NODE_ENV', 'test');
  });

  it('applies pre-compilation', async () => {
    const { applyPreCompilation } = applyJestExtraOptions({ name, args: [] });
    await applyPreCompilation();
    expect(preCompile).toBeCalled();
  });
});
