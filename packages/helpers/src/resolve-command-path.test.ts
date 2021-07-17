import fs from 'fs';
import readCmdShim from 'read-cmd-shim';
import { mocked } from 'ts-jest/utils';
import { resolveCommandPath } from './resolve-command-path';

const commandName = 'commandName';
const symbolicLinkValue = 'symbolicLinkValue';
const cmdShimValue = 'cmdShimValue';
const processCwdResult = '/process/cwd';

jest.spyOn(fs, 'readlinkSync');
jest.spyOn(readCmdShim, 'sync');
jest.spyOn(process, 'cwd').mockReturnValue(processCwdResult);

describe('resolveCommandPath', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('works with symbolic link', () => {
    mocked(fs.readlinkSync).mockReturnValueOnce(symbolicLinkValue);
    const commandPath = resolveCommandPath({ commandName });
    expect(process.cwd).toBeCalledTimes(1);
    expect(mocked(fs.readlinkSync).mock.calls[0][0]).toMatch(
      new RegExp(`^${processCwdResult}.*${commandName}$`)
    );
    expect(commandPath).toMatch(new RegExp(`^${processCwdResult}.*${symbolicLinkValue}$`));
  });

  it('works with cmd shim', () => {
    mocked(fs.readlinkSync).mockImplementationOnce(() => {
      throw 0;
    });
    mocked(readCmdShim.sync).mockReturnValueOnce(cmdShimValue);
    const commandPath = resolveCommandPath({ commandName });
    expect(process.cwd).toBeCalledTimes(1);
    expect(mocked(fs.readlinkSync).mock.calls[0][0]).toMatch(
      new RegExp(`^${processCwdResult}.*${commandName}$`)
    );
    expect(commandPath).toMatch(new RegExp(`^${processCwdResult}.*${cmdShimValue}$`));
  });

  it('works with specified cwd', () => {
    const specifiedCwd = '/specified/cwd';
    mocked(fs.readlinkSync).mockReturnValueOnce(symbolicLinkValue);
    const commandPath = resolveCommandPath({ cwd: specifiedCwd, commandName });
    expect(process.cwd).not.toBeCalled();
    expect(commandPath).toMatch(new RegExp(`^${specifiedCwd}.*${symbolicLinkValue}$`));
  });
});
