import { logError, logPlain, resolveCommandPath, resolveCommandSemVer } from '@wuzzle/helpers';
import { mocked } from 'ts-jest/utils';
import {
  EK_COMMAND_ARGS,
  EK_INTERNAL_PRE_CONFIG,
  EK_REACT_SCRIPTS_SKIP_PREFLIGHT_CHECK,
  EXIT_CODE_ERROR,
} from '../constants';
import {
  applyJestExtraOptions,
  doFileRegistering,
  execNode,
  FileRegisteringOptions,
  LaunchOptions,
  tmplLogForGlobalResolving,
} from '../utils';
import { launchReactScripts } from './react-scripts';

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
  registerName: 'react-scripts',
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

describe('launchReactScripts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env[EK_COMMAND_ARGS] = '[]';
    delete process.env[EK_INTERNAL_PRE_CONFIG];
    delete process.env[EK_REACT_SCRIPTS_SKIP_PREFLIGHT_CHECK];
  });

  it('executes with register attached and envs set if command resolved', () => {
    launchReactScripts(launchOptions);
    expect(resolveCommandPath).toBeCalled();
    expect(resolveCommandSemVer).toBeCalled();
    expect(doFileRegistering).toBeCalledWith(fileRegisteringOptions);
    expect(execNode).toBeCalledWith(
      expect.objectContaining({
        execArgs: expect.arrayContaining([commandPath]),
      })
    );
    expect(process.env[EK_REACT_SCRIPTS_SKIP_PREFLIGHT_CHECK]).toBe('true');
  });

  it('resolves react-scripts global if command not resolved from locals', () => {
    mocked(resolveCommandPath).mockImplementationOnce(() => {
      throw 0;
    });
    launchReactScripts(launchOptions);
    expect(resolveCommandPath).toBeCalledWith(expect.objectContaining({ fromGlobals: true }));
    expect(logPlain).toBeCalledWith(logForGlobalResolving);
    expect(resolveCommandSemVer).toBeCalled();
    expect(doFileRegistering).toBeCalledWith(fileRegisteringOptions);
    expect(execNode).toBeCalledWith(
      expect.objectContaining({
        execArgs: expect.arrayContaining([commandPath]),
      })
    );
    expect(process.env[EK_REACT_SCRIPTS_SKIP_PREFLIGHT_CHECK]).toBe('true');
  });

  it('prepares jest extra options on testing command', () => {
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['test']);
    launchReactScripts(launchOptions);
    expect(applyJestExtraOptions).toBeCalled();
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
      launchReactScripts(launchOptions);
    } catch {}
    expect(logError).toBeCalledWith(expect.stringContaining(commandName));
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
    expect(execNode).not.toBeCalled();
  });
});
