import fs from 'fs';
import path from 'path';
import readCmdShim from 'read-cmd-shim';
import { mocked } from 'ts-jest/utils';
import which from 'which';
import { resolveCommandPath } from './resolve-command-path';

const commandName = 'commandName';
const symbolicLinkValue = 'symbolicLinkValue';
const cmdShimValue = 'cmdShimValue';
const processCwdResult = path.normalize('/path/to/process/cwd');
const specifiedCwd = path.normalize('/path/to/specified/cwd');
const whichQueryResult = path.normalize('/path/to/which/query');
const whichQueryResultOnWin = whichQueryResult + '.CMD';

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
    [processCwdResult, commandName].forEach(p =>
      expect(fs.readlinkSync).toBeCalledWith(expect.stringContaining(p))
    );
    [processCwdResult, symbolicLinkValue].forEach(p =>
      expect(commandPath).toEqual(expect.stringContaining(p))
    );
  });

  it('works with cmd shim', () => {
    mocked(fs.readlinkSync).mockImplementationOnce(() => {
      throw 0;
    });
    mocked(readCmdShim.sync).mockReturnValueOnce(cmdShimValue);
    const commandPath = resolveCommandPath({ commandName });
    [processCwdResult, commandName].forEach(p =>
      expect(readCmdShim.sync).toBeCalledWith(expect.stringContaining(p))
    );
    [processCwdResult, cmdShimValue].forEach(p =>
      expect(commandPath).toEqual(expect.stringContaining(p))
    );
  });

  it('works with specified cwd', () => {
    mocked(fs.readlinkSync).mockReturnValueOnce(symbolicLinkValue);
    const commandPath = resolveCommandPath({ cwd: specifiedCwd, commandName });
    [specifiedCwd, commandName].forEach(p =>
      expect(fs.readlinkSync).toBeCalledWith(expect.stringContaining(p))
    );
    [specifiedCwd, symbolicLinkValue].forEach(p =>
      expect(commandPath).toEqual(expect.stringContaining(p))
    );
  });

  it('works with global symbolic link', () => {
    mocked(fs.readlinkSync).mockReturnValueOnce(symbolicLinkValue);
    mocked(which.sync).mockReturnValueOnce(whichQueryResult);
    const commandPath = resolveCommandPath({ commandName, fromGlobals: true });
    expect(fs.readlinkSync).toBeCalledWith(whichQueryResult);
    [path.dirname(whichQueryResult), symbolicLinkValue].forEach(p =>
      expect(commandPath).toEqual(expect.stringContaining(p))
    );
  });

  it('works with global cmd shim', () => {
    mocked(fs.readlinkSync).mockImplementationOnce(() => {
      throw 0;
    });
    mocked(readCmdShim.sync).mockReturnValueOnce(cmdShimValue);
    mocked(which.sync).mockReturnValueOnce(whichQueryResultOnWin);
    const commandPath = resolveCommandPath({ commandName, fromGlobals: true });
    expect(readCmdShim.sync).toBeCalledWith(whichQueryResult);
    [path.dirname(whichQueryResult), cmdShimValue].forEach(p =>
      expect(commandPath).toEqual(expect.stringContaining(p))
    );
  });
});
