import { logError, logPlain, resolveCommandPath, resolveCommandSemVer } from '@wuzzle/helpers';
import { mocked } from 'ts-jest/utils';
import { EK, EXIT_CODE_ERROR } from '../constants';
import {
  applyJestExtraOptions,
  doFileRegistering,
  envGet,
  envSet,
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

const applyPreCompilation = jest.fn();
mocked(applyJestExtraOptions).mockReturnValue({ applyPreCompilation });
mocked(envGet).mockReturnValue([]);
mocked(tmplLogForGlobalResolving).mockReturnValue(logForGlobalResolving);
mocked(resolveCommandPath).mockReturnValue(commandPath);
mocked(resolveCommandSemVer).mockReturnValue({ major: majorVersion } as never);

describe('launchReactScripts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executes with register attached and envs set if command resolved', async () => {
    await launchReactScripts(launchOptions);
    expect(resolveCommandPath).toBeCalled();
    expect(resolveCommandSemVer).toBeCalled();
    expect(doFileRegistering).toBeCalledWith(fileRegisteringOptions);
    expect(execNode).toBeCalledWith(
      expect.objectContaining({
        execArgs: expect.arrayContaining([commandPath]),
      })
    );
    expect(envSet).toBeCalledWith(EK.TP_SKIP_PREFLIGHT_CHECK, 'true');
  });

  it('resolves react-scripts global if command not resolved from locals', async () => {
    mocked(resolveCommandPath).mockImplementationOnce(() => {
      throw 0;
    });
    await launchReactScripts(launchOptions);
    expect(resolveCommandPath).toBeCalledWith(expect.objectContaining({ fromGlobals: true }));
    expect(logPlain).toBeCalledWith(logForGlobalResolving);
    expect(resolveCommandSemVer).toBeCalled();
    expect(doFileRegistering).toBeCalledWith(fileRegisteringOptions);
    expect(execNode).toBeCalledWith(
      expect.objectContaining({
        execArgs: expect.arrayContaining([commandPath]),
      })
    );
    expect(envSet).toBeCalledWith(EK.TP_SKIP_PREFLIGHT_CHECK, 'true');
  });

  it('prepares jest extra options and pre-compiles on testing command', async () => {
    mocked(envGet).mockReturnValue(['test']);
    await launchReactScripts(launchOptions);
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
      await launchReactScripts(launchOptions);
    } catch {}
    expect(logError).toBeCalledWith(expect.stringContaining(commandName));
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
    expect(execNode).not.toBeCalled();
  });
});
