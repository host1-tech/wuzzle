import { mocked } from 'ts-jest/utils';

import { logError, logPlain, resolveCommandPath, resolveCommandSemVer } from '@wuzzle/helpers';

import { EXIT_CODE_ERROR } from '../constants';
import {
  doFileRegistering,
  execNode,
  FileRegisteringOptions,
  LaunchOptions,
  tmplLogForGlobalResolving,
} from '../utils';
import { launchCypress } from './cypress';

const commandName = 'commandName';
const commandPath = '/path/to/command';
const launchOptions: LaunchOptions = {
  nodePath: '/path/to/node',
  args: [],
  projectPath: '/path/to/project',
  commandName,
};
const logForGlobalResolving = 'log for global resolving';
const majorVersion = 5;
const fileRegisteringOptions: FileRegisteringOptions = {
  registerName: 'cypress',
  majorVersion,
  commandPath,
};

jest.mock('@wuzzle/helpers');
jest.mock('../utils');
jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});
mocked(tmplLogForGlobalResolving).mockReturnValue(logForGlobalResolving);
mocked(resolveCommandPath).mockReturnValue(commandPath);
mocked(resolveCommandSemVer).mockReturnValue({ major: majorVersion } as never);

describe('launchCypress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executes with cypress register attached if command resolved', () => {
    launchCypress(launchOptions);
    expect(resolveCommandPath).toBeCalled();
    expect(resolveCommandSemVer).toBeCalled();
    expect(doFileRegistering).toBeCalledWith(fileRegisteringOptions);
    expect(execNode).toBeCalledWith(
      expect.objectContaining({
        execArgs: expect.arrayContaining([commandPath]),
      })
    );
  });

  it('resolves cypress global if command not resolved from locals', () => {
    mocked(resolveCommandPath).mockImplementationOnce(() => {
      throw 0;
    });
    launchCypress(launchOptions);
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

  it('exits with error code and error message if command not resolved', () => {
    mocked(resolveCommandPath)
      .mockImplementationOnce(() => {
        throw 0;
      })
      .mockImplementationOnce(() => {
        throw 0;
      });
    try {
      launchCypress(launchOptions);
    } catch {}
    expect(logError).toBeCalledWith(expect.stringContaining(commandName));
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
    expect(execNode).not.toBeCalled();
  });
});
