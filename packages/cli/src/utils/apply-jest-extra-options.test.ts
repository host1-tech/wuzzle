import { Command } from 'commander';
import { EK } from '../constants';
import { applyJestExtraOptions, getJestExtraCommandOpts } from './apply-jest-extra-options';
import { envGetDefault, envSet } from './env-get-set';

jest.mock('./env-get-set', () => ({
  ...jest.requireActual('./env-get-set'),
  envSet: jest.fn(),
}));

jest.spyOn(Command.prototype, 'parse');

describe('getJestExtraCommandOpts', () => {
  it('works', () => expect(getJestExtraCommandOpts()).toBeTruthy());
});

describe('applyJestExtraOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps args and sets default options if no extra arg matched', () => {
    const nodePath = '/path/to/node';
    const name = 'name';
    const oldArgs = ['--version'];
    const newArgs = [...oldArgs];
    applyJestExtraOptions({ nodePath, name, args: newArgs });
    expect(newArgs).toEqual(oldArgs);
    expect(Command.prototype.parse).not.toBeCalled();
    expect(envSet).toBeCalledWith(EK.JEST_EXTRA_OPTIONS, envGetDefault(EK.JEST_EXTRA_OPTIONS));
  });

  it('deletes matched args and sets options with modification if some extra args matched', () => {
    const nodePath = '/path/to/node';
    const name = 'name';
    const oldArgs = ['--no-webpack', 'main.test.js'];
    const newArgs = [...oldArgs];
    applyJestExtraOptions({ nodePath, name, args: newArgs });
    expect(newArgs).toEqual(['main.test.js']);
    expect(Command.prototype.parse).toBeCalledWith([nodePath, name, ...oldArgs]);
    expect(envSet).toBeCalledWith(EK.JEST_EXTRA_OPTIONS, {
      ...envGetDefault(EK.JEST_EXTRA_OPTIONS),
      webpack: false,
    });
  });

  it('works with nodePath omitted', () => {
    const name = 'name';
    const oldArgs = ['--no-webpack', 'main.test.js'];
    const newArgs = [...oldArgs];
    applyJestExtraOptions({ name, args: newArgs });
    expect(newArgs).toEqual(['main.test.js']);
    expect(Command.prototype.parse).toBeCalledWith([process.argv[0], name, ...oldArgs]);
    expect(envSet).toBeCalledWith(EK.JEST_EXTRA_OPTIONS, {
      ...envGetDefault(EK.JEST_EXTRA_OPTIONS),
      webpack: false,
    });
  });
});
