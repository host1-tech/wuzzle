import fs from 'fs';
import readCmdShim from 'read-cmd-shim';
import { mocked } from 'ts-jest/utils';
import { resolveCommandPath } from './resolve-command-path';

const symbolicLinkValue = 'symbolicLinkValue';
const cmdShimValue = 'cmdShimValue';
const processCwdResult = '/process/cwd';

jest.spyOn(fs, 'readlinkSync');
const mockedFsReadlinkSync = mocked(fs.readlinkSync);

jest.spyOn(readCmdShim, 'sync');
const mockedReadCmdShimSync = mocked(readCmdShim.sync);

jest.spyOn(process, 'cwd');
const mockedProcessCwd = mocked(process.cwd).mockReturnValue(processCwdResult);

const commandName = 'commandName';

describe('resolveCommandPath', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('works with symbolic link', () => {
    mockedFsReadlinkSync.mockReturnValueOnce(symbolicLinkValue);
    const commandPath = resolveCommandPath({ commandName });
    expect(mockedProcessCwd).toBeCalledTimes(1);
    expect(mockedFsReadlinkSync).toBeCalledTimes(1);
    expect(mockedFsReadlinkSync.mock.calls[0][0]).toMatch(
      new RegExp(`^${processCwdResult}.*${commandName}$`)
    );
    expect(commandPath).toMatch(new RegExp(`^${processCwdResult}.*${symbolicLinkValue}$`));
  });

  it('works with cmd shim', () => {
    mockedFsReadlinkSync.mockImplementationOnce(() => {
      throw 0;
    });
    mockedReadCmdShimSync.mockReturnValueOnce(cmdShimValue);
    const commandPath = resolveCommandPath({ commandName });
    expect(mockedProcessCwd).toBeCalledTimes(1);
    expect(mockedFsReadlinkSync).toBeCalledTimes(1);
    expect(mockedFsReadlinkSync.mock.calls[0][0]).toMatch(
      new RegExp(`^${processCwdResult}.*${commandName}$`)
    );
    expect(commandPath).toMatch(new RegExp(`^${processCwdResult}.*${cmdShimValue}$`));
  });

  it('works with specified cwd', () => {
    const specifiedCwd = '/specified/cwd';
    mockedFsReadlinkSync.mockReturnValueOnce(symbolicLinkValue);
    const commandPath = resolveCommandPath({ cwd: specifiedCwd, commandName });
    expect(mockedProcessCwd).not.toBeCalled();
    expect(commandPath).toMatch(new RegExp(`^${specifiedCwd}.*${symbolicLinkValue}$`));
  });
});
