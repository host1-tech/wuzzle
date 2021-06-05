import findUp from 'find-up';
import fs from 'fs';
import { mocked } from 'ts-jest/utils';
import * as resolveRequireHelper from './resolve-require';
import { resolveCommandSemVer, resolveWebpackSemVer, SemVer } from './resolve-sem-ver';

const commandPath = '/path/to/command';
const version = '1.0.0';
const packageJsonPath = '/path/to/package.json';
const packageJsonBuf = Buffer.from(JSON.stringify({ version }));
const packageJsonInvalidBuf = Buffer.from(JSON.stringify({ version: 'random' }));
const webpackEntryPath = '/path/to/webpack/entry';

jest.spyOn(findUp, 'sync');
const mockedFindUpSync = mocked(findUp.sync);

jest.spyOn(fs, 'readFileSync');
const mockedFsReadFileSync = mocked(fs.readFileSync);

jest.spyOn(resolveRequireHelper, 'resolveRequire');
const mockedResolveRequire = mocked(resolveRequireHelper.resolveRequire);

describe('resolveCommandSemVer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('works on package located and version parsed', () => {
    mockedFindUpSync.mockReturnValueOnce(packageJsonPath);
    mockedFsReadFileSync.mockReturnValueOnce(packageJsonBuf);
    const semVer = resolveCommandSemVer(commandPath);
    expect(semVer.version).toBe(version);
    expect(mockedFindUpSync).toBeCalledWith('package.json', { cwd: commandPath });
    expect(mockedFsReadFileSync).toBeCalledWith(packageJsonPath);
  });

  it('throws error on package not located', () => {
    mockedFindUpSync.mockReturnValueOnce(undefined);
    expect(() => resolveCommandSemVer(commandPath)).toThrow();
  });

  it('throws error on version not parsed', () => {
    mockedFindUpSync.mockReturnValueOnce(packageJsonPath);
    mockedFsReadFileSync.mockReturnValueOnce(packageJsonInvalidBuf);
    expect(() => resolveCommandSemVer(commandPath)).toThrow();
  });
});

describe('resolveWebpackSemVer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('works on webpack package located and its version parsed', () => {
    mockedResolveRequire.mockReturnValueOnce(webpackEntryPath);
    mockedFindUpSync.mockReturnValueOnce(packageJsonPath);
    mockedFsReadFileSync.mockReturnValueOnce(packageJsonBuf);
    const semVer = resolveWebpackSemVer(commandPath);
    expect(semVer).toBeInstanceOf(SemVer);
    expect(semVer.version).toBe(version);
    expect(mockedResolveRequire).toBeCalledWith('webpack', { paths: [commandPath] });
    expect(mockedFindUpSync).toBeCalledWith('package.json', { cwd: webpackEntryPath });
    expect(mockedFsReadFileSync).toBeCalledWith(packageJsonPath);
  });

  it('throws error on webpack package not located', () => {
    mockedResolveRequire.mockReturnValueOnce(webpackEntryPath);
    mockedFindUpSync.mockReturnValueOnce(undefined);
    expect(() => resolveWebpackSemVer(commandPath)).toThrow();
  });

  it('throws error on webpack version not parsed', () => {
    mockedResolveRequire.mockReturnValueOnce(webpackEntryPath);
    mockedFindUpSync.mockReturnValueOnce(packageJsonPath);
    mockedFsReadFileSync.mockReturnValueOnce(packageJsonInvalidBuf);
    expect(() => resolveWebpackSemVer(commandPath)).toThrow();
  });
});
