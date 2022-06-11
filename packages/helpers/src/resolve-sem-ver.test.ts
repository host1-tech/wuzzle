import findUp from 'find-up';
import fs from 'fs';
import path from 'path';
import { SemVer } from 'semver';
import { mocked } from 'ts-jest/utils';

import { resolveRequire } from './resolve-require';
import { resolveCommandSemVer, resolveWebpackSemVer } from './resolve-sem-ver';

const commandPath = '/path/to/command';
const version = '1.0.0';
const packageJsonPath = '/path/to/package.json';
const packageJsonBuf = Buffer.from(JSON.stringify({ version }));
const packageJsonInvalidBuf = Buffer.from(JSON.stringify({ version: 'random' }));
const webpackEntryPath = '/path/to/webpack/entry';

jest.spyOn(findUp, 'sync');
jest.spyOn(fs, 'readFileSync');
jest.mock('./resolve-require');

describe('resolveCommandSemVer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('works on package located and version parsed', () => {
    mocked(findUp.sync).mockReturnValueOnce(packageJsonPath);
    mocked(fs.readFileSync).mockReturnValueOnce(packageJsonBuf);
    const semVer = resolveCommandSemVer(commandPath);
    expect(semVer.version).toBe(version);
    expect(findUp.sync).toBeCalledWith('package.json', { cwd: commandPath });
    expect(fs.readFileSync).toBeCalledWith(packageJsonPath);
  });

  it('throws error on package not located', () => {
    mocked(findUp.sync).mockReturnValueOnce(undefined);
    expect(() => resolveCommandSemVer(commandPath)).toThrow();
  });

  it('throws error on version not parsed', () => {
    mocked(findUp.sync).mockReturnValueOnce(packageJsonPath);
    mocked(fs.readFileSync).mockReturnValueOnce(packageJsonInvalidBuf);
    expect(() => resolveCommandSemVer(commandPath)).toThrow();
  });
});

describe('resolveWebpackSemVer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('works on webpack package located and its version parsed', () => {
    mocked(resolveRequire).mockReturnValueOnce(webpackEntryPath);
    mocked(findUp.sync).mockReturnValueOnce(packageJsonPath);
    mocked(fs.readFileSync).mockReturnValueOnce(packageJsonBuf);
    const semVer = resolveWebpackSemVer(commandPath);
    expect(semVer).toBeInstanceOf(SemVer);
    expect(semVer.version).toBe(version);
    expect(resolveRequire).toBeCalledWith('webpack', { basedir: path.dirname(commandPath) });
    expect(findUp.sync).toBeCalledWith('package.json', { cwd: webpackEntryPath });
    expect(fs.readFileSync).toBeCalledWith(packageJsonPath);
  });

  it('throws error on webpack package not located', () => {
    mocked(resolveRequire).mockReturnValueOnce(webpackEntryPath);
    mocked(findUp.sync).mockReturnValueOnce(undefined);
    expect(() => resolveWebpackSemVer(commandPath)).toThrow();
  });

  it('throws error on webpack version not parsed', () => {
    mocked(resolveRequire).mockReturnValueOnce(webpackEntryPath);
    mocked(findUp.sync).mockReturnValueOnce(packageJsonPath);
    mocked(fs.readFileSync).mockReturnValueOnce(packageJsonInvalidBuf);
    expect(() => resolveWebpackSemVer(commandPath)).toThrow();
  });
});
