import { Command } from 'commander';
import { JestExtraOptions } from '.';
import { EK_JEST_EXTRA_OPTIONS } from '../constants';
import {
  applyJestExtraOptions,
  getCurrentJestExtraOptions,
  getDefaultJestExtraOptions,
  getJestExtraCommandOpts,
} from './apply-jest-extra-options';

jest.spyOn(Command.prototype, 'parse');

describe('getDefaultJestExtraOptions', () => {
  it('works', () => expect(getDefaultJestExtraOptions()).toBeTruthy());
});

describe('getCurrentJestExtraOptions', () => {
  beforeEach(() => {
    delete process.env[EK_JEST_EXTRA_OPTIONS];
  });

  it('works', () => {
    const jestExtraOptions: JestExtraOptions = { webpack: false };
    process.env[EK_JEST_EXTRA_OPTIONS] = JSON.stringify(jestExtraOptions);
    expect(getCurrentJestExtraOptions()).toEqual({
      ...getDefaultJestExtraOptions(),
      webpack: false,
    });
  });
});

describe('getJestExtraCommandOpts', () => {
  it('works', () => expect(getJestExtraCommandOpts()).toBeTruthy());
});

describe('applyJestExtraOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env[EK_JEST_EXTRA_OPTIONS];
  });

  it('keeps args and sets default options if no extra arg matched', () => {
    const nodePath = '/path/to/node';
    const name = 'name';
    const oldArgs = ['--version'];
    const newArgs = [...oldArgs];
    applyJestExtraOptions({ nodePath, name, args: newArgs });
    expect(newArgs).toEqual(oldArgs);
    expect(Command.prototype.parse).toBeCalledTimes(0);
    expect(process.env[EK_JEST_EXTRA_OPTIONS]).toEqual(
      JSON.stringify(getDefaultJestExtraOptions())
    );
  });

  it('deletes matched args and sets options with modification if some extra args matched', () => {
    const nodePath = '/path/to/node';
    const name = 'name';
    const oldArgs = ['--no-webpack', 'main.test.js'];
    const newArgs = [...oldArgs];
    applyJestExtraOptions({ nodePath, name, args: newArgs });
    expect(newArgs).toEqual(['main.test.js']);
    expect(Command.prototype.parse).toBeCalledWith([nodePath, name, ...oldArgs]);
    expect(process.env[EK_JEST_EXTRA_OPTIONS]).toEqual(
      JSON.stringify({ ...getDefaultJestExtraOptions(), webpack: false })
    );
  });

  it('works with nodePath omitted', () => {
    const name = 'name';
    const oldArgs = ['--no-webpack', 'main.test.js'];
    const newArgs = [...oldArgs];
    applyJestExtraOptions({ name, args: newArgs });
    expect(newArgs).toEqual(['main.test.js']);
    expect(Command.prototype.parse).toBeCalledWith([process.argv[0], name, ...oldArgs]);
    expect(process.env[EK_JEST_EXTRA_OPTIONS]).toEqual(
      JSON.stringify({ ...getDefaultJestExtraOptions(), webpack: false })
    );
  });
});
