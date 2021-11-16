import fs from 'fs';
import readCmdShim from 'read-cmd-shim';
import { mocked } from 'ts-jest/utils';
import which from 'which';
import { resolveCommandPath } from './resolve-command-path';
import path from 'path';

const commandName = 'commandName';
const symbolicLinkValue = 'symbolicLinkValue';
const cmdShimValue = 'cmdShimValue';
const whichQueryResult = '/path/to/which/query';
const processCwdResult = '/path/to/process/cwd';

jest.spyOn(fs, 'readlinkSync');
jest.spyOn(readCmdShim, 'sync');
jest.spyOn(which, 'sync');
jest.spyOn(process, 'cwd').mockReturnValue(processCwdResult);

describe('resolveCommandPath', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('works with symbolic link', () => {
    mocked(fs.readlinkSync).mockReturnValueOnce(symbolicLinkValue);
    const commandPath = resolveCommandPath({ commandName });
    expect(fs.readlinkSync).toBeCalledWith(
      expect.stringMatching(new RegExp(`^${processCwdResult}.*${commandName}$`))
    );
    expect(commandPath).toMatch(new RegExp(`^${processCwdResult}.*${symbolicLinkValue}$`));
  });

  it('works with cmd shim', () => {
    mocked(fs.readlinkSync).mockImplementationOnce(() => {
      throw 0;
    });
    mocked(readCmdShim.sync).mockReturnValueOnce(cmdShimValue);
    const commandPath = resolveCommandPath({ commandName });
    expect(readCmdShim.sync).toBeCalledWith(
      expect.stringMatching(new RegExp(`^${processCwdResult}.*${commandName}$`))
    );
    expect(commandPath).toMatch(new RegExp(`^${processCwdResult}.*${cmdShimValue}$`));
  });

  it('works with specified cwd', () => {
    const specifiedCwd = '/path/to/specified/cwd';
    mocked(fs.readlinkSync).mockReturnValueOnce(symbolicLinkValue);
    const commandPath = resolveCommandPath({ cwd: specifiedCwd, commandName });
    expect(fs.readlinkSync).toBeCalledWith(
      expect.stringMatching(new RegExp(`^${specifiedCwd}.*${commandName}$`))
    );
    expect(commandPath).toMatch(new RegExp(`^${specifiedCwd}.*${symbolicLinkValue}$`));
  });

  it('reads from globals if requested', () => {
    mocked(fs.readlinkSync).mockReturnValueOnce(symbolicLinkValue);
    mocked(which.sync).mockReturnValueOnce(whichQueryResult);
    const commandPath = resolveCommandPath({ commandName, fromGlobals: true });
    expect(fs.readlinkSync).toBeCalledWith(whichQueryResult);
    expect(commandPath).toMatch(
      new RegExp(`^${path.dirname(whichQueryResult)}.*${symbolicLinkValue}$`)
    );
  });
});
