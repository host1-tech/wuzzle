import { resolveCommandPath, resolveRequire } from '@wuzzle/helpers';
import { noop } from 'lodash';
import { mocked } from 'ts-jest/utils';
import { EK_INTERNAL_PRE_CONFIG, EXIT_CODE_ERROR } from '../constants';
import { register } from '../registers/razzle__3.x';
import { execNode, LaunchOptions, tmplLogForGlobalResolving } from '../utils';
import { launchRazzle } from './razzle';

const commandName = 'commandName';
const commandPath = '/path/to/command';
const logForGlobalResolving = 'log for global resolving';
const launchOptions: LaunchOptions = {
  nodePath: '/path/to/node',
  args: [],
  projectPath: '/path/to/project',
  commandName,
};
const razzlePreConfigPath = '/path/to/pre-config/razzle';

jest.mock('@wuzzle/helpers');
jest.mock('../registers/razzle__3.x');
jest.mock('../utils');
jest.spyOn(console, 'log').mockImplementation(noop);
jest.spyOn(console, 'error').mockImplementation(noop);
jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});
mocked(tmplLogForGlobalResolving).mockReturnValue(logForGlobalResolving);
mocked(resolveCommandPath).mockReturnValue(commandPath);

describe('launchRazzle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env[EK_INTERNAL_PRE_CONFIG];
  });

  it('executes with register attached and pre config set if command resolved', () => {
    mocked(resolveRequire).mockReturnValueOnce(razzlePreConfigPath);
    launchRazzle(launchOptions);
    expect(resolveCommandPath).toBeCalled();
    expect(register).toBeCalledWith({ commandPath });
    expect(execNode).toBeCalledWith(
      expect.objectContaining({
        execArgs: expect.arrayContaining([commandPath]),
      })
    );
    expect(process.env[EK_INTERNAL_PRE_CONFIG]).toBe(razzlePreConfigPath);
  });

  it('resolves razzle global if command not resolved from locals', () => {
    mocked(resolveCommandPath).mockImplementationOnce(() => {
      throw 0;
    });
    mocked(resolveRequire).mockReturnValueOnce(razzlePreConfigPath);
    launchRazzle(launchOptions);
    expect(resolveCommandPath).toBeCalledWith(expect.objectContaining({ fromGlobals: true }));
    expect(console.log).toBeCalledWith(logForGlobalResolving);
    expect(register).toBeCalledWith({ commandPath });
    expect(execNode).toBeCalledWith(
      expect.objectContaining({
        execArgs: expect.arrayContaining([commandPath]),
      })
    );
    expect(process.env[EK_INTERNAL_PRE_CONFIG]).toBe(razzlePreConfigPath);
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
      launchRazzle(launchOptions);
    } catch {}
    expect(console.error).toBeCalledWith(expect.stringContaining(commandName));
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
    expect(execNode).not.toBeCalled();
  });
});
