import { resolveCommandPath, resolveWebpackSemVer } from '@wuzzle/helpers';
import { noop } from 'lodash';
import { mocked } from 'ts-jest/utils';
import { EXIT_CODE_ERROR } from '../constants';
import { register } from '../registers/webpack__5.x';
import { execNode, LaunchOptions, tmplLogForGlobalResolving } from '../utils';
import { launchDefault } from './default';

const commandName = 'commandName';
const commandPath = '/path/to/command';
const logForGlobalResolving = 'log for global resolving';
const launchOptions: LaunchOptions = {
  nodePath: '/path/to/node',
  args: [],
  projectPath: '/path/to/project',
  commandName,
};

jest.mock('@wuzzle/helpers');
jest.mock('../registers/webpack__5.x', () => ({ register: jest.fn() }));
jest.mock('../utils');
jest.spyOn(console, 'log').mockImplementation(noop);
jest.spyOn(console, 'error').mockImplementation(noop);
jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});
mocked(tmplLogForGlobalResolving).mockReturnValue(logForGlobalResolving);
mocked(resolveCommandPath).mockReturnValue(commandPath);
mocked(resolveWebpackSemVer).mockReturnValue({ major: 5 } as never);

describe('launchDefault', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executes with webpack register attached if command resolved', () => {
    launchDefault(launchOptions);
    expect(resolveCommandPath).toBeCalled();
    expect(resolveWebpackSemVer).toBeCalled();
    expect(register).toBeCalledWith({ commandPath });
    expect(execNode).toBeCalledWith(
      expect.objectContaining({
        execArgs: expect.arrayContaining([commandPath]),
      })
    );
  });

  it('resolves webpack global if command not resolved from locals', () => {
    mocked(resolveCommandPath).mockImplementationOnce(() => {
      throw 0;
    });
    launchDefault(launchOptions);
    expect(resolveCommandPath).toBeCalledWith(expect.objectContaining({ fromGlobals: true }));
    expect(console.log).toBeCalledWith(logForGlobalResolving);
    expect(resolveWebpackSemVer).toBeCalled();
    expect(register).toBeCalledWith({ commandPath });
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
      launchDefault(launchOptions);
    } catch {}
    expect(console.error).toBeCalledWith(expect.stringContaining(commandName));
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
    expect(execNode).not.toBeCalled();
  });
});
