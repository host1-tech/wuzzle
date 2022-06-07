import { logError, logPlain, resolveCommandPath, resolveCommandSemVer } from '@wuzzle/helpers';
import { mocked } from 'ts-jest/utils';
import { EXIT_CODE_ERROR } from '../constants';
import {
  applyJestExtraOptions,
  doFileRegistering,
  envGet,
  execNode,
  FileRegisteringOptions,
  LaunchOptions,
  tmplLogForGlobalResolving,
} from '../utils';
import { launchRazzle } from './razzle';

const commandName = 'commandName';
const commandPath = '/path/to/command';
const launchOptions: LaunchOptions = {
  nodePath: '/path/to/node',
  args: [],
  projectPath: '/path/to/project',
  commandName,
};
const logForGlobalResolving = 'log for global resolving';
const majorVersion = 3;
const fileRegisteringOptions: FileRegisteringOptions = {
  registerName: 'razzle',
  majorVersion,
  commandPath,
};

jest.mock('@wuzzle/helpers');
jest.mock('../utils');
jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});
const applyPreCompilation = jest.fn();
mocked(applyJestExtraOptions).mockReturnValue({ applyPreCompilation });
mocked(envGet).mockReturnValue([]);
mocked(resolveCommandPath).mockReturnValue(commandPath);
mocked(resolveCommandSemVer).mockReturnValue({ major: majorVersion } as never);
mocked(tmplLogForGlobalResolving).mockReturnValue(logForGlobalResolving);

describe('launchRazzle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executes with razzle register attached if command resolved', async () => {
    await launchRazzle(launchOptions);
    expect(resolveCommandPath).toBeCalled();
    expect(resolveCommandSemVer).toBeCalled();
    expect(doFileRegistering).toBeCalledWith(fileRegisteringOptions);
    expect(execNode).toBeCalledWith(
      expect.objectContaining({
        execArgs: expect.arrayContaining([commandPath]),
      })
    );
  });

  it('resolves razzle global if command not resolved from locals', async () => {
    mocked(resolveCommandPath).mockImplementationOnce(() => {
      throw 0;
    });
    await launchRazzle(launchOptions);
    expect(resolveCommandPath).toBeCalledWith(expect.objectContaining({ fromGlobals: true }));
    expect(logPlain).toBeCalledWith(logForGlobalResolving);
    expect(resolveCommandSemVer).toBeCalled();
    expect(doFileRegistering).toBeCalledWith(fileRegisteringOptions);
    expect(execNode).toBeCalledWith(
      expect.objectContaining({
        execArgs: expect.arrayContaining([commandPath]),
      })
    );
  });

  it('prepares jest extra options and pre-compiles on testing command', async () => {
    mocked(envGet).mockReturnValueOnce(['test']);
    await launchRazzle(launchOptions);
    expect(applyJestExtraOptions).toBeCalled();
    expect(applyPreCompilation).toBeCalled();
  });

  it('exits with error code and error message if command not resolved', async () => {
    mocked(resolveCommandPath)
      .mockImplementationOnce(() => {
        throw 0;
      })
      .mockImplementationOnce(() => {
        throw 0;
      });
    try {
      await launchRazzle(launchOptions);
    } catch {}
    expect(logError).toBeCalledWith(expect.stringContaining(commandName));
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
    expect(execNode).not.toBeCalled();
  });
});
