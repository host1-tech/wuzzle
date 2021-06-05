import execa from 'execa';
import { random } from 'lodash';
import { mocked } from 'ts-jest/utils';
import { EK_COMMAND_ARGS } from '../constants';
import { execNode } from './exec-node';

jest.spyOn(execa, 'sync');
const mockedExecaSync = mocked(execa.sync);

jest.spyOn(console, 'error');
const mockedConsoleError = mocked(console.error);

jest.spyOn(process, 'exit');
const mockedProcessExit = mocked(process.exit);

describe('execNode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env[EK_COMMAND_ARGS];
  });

  it('works with default options', () => {
    mockedExecaSync.mockImplementationOnce(() => ({} as never));
    execNode({});
    expect(process.env[EK_COMMAND_ARGS]).toBe(JSON.stringify([]));
    expect(mockedExecaSync).toBeCalledWith(process.argv[0], [], { stdio: 'inherit' });
  });

  it('uses args as execution args by default', () => {
    const nodePath = '/path/to/node';
    const args = ['--verbose'];
    mockedExecaSync.mockImplementationOnce(() => ({} as never));
    execNode({ nodePath, args });
    expect(process.env[EK_COMMAND_ARGS]).toBe(JSON.stringify(args));
    expect(mockedExecaSync).toBeCalledWith(nodePath, args, { stdio: 'inherit' });
  });

  it('overrides execution args with execArgs', () => {
    const nodePath = '/path/to/node';
    const args = ['--verbose'];
    const execArgs = ['--help'];
    mockedExecaSync.mockImplementationOnce(() => ({} as never));
    execNode({ nodePath, args, execArgs });
    expect(process.env[EK_COMMAND_ARGS]).toBe(JSON.stringify(args));
    expect(mockedExecaSync).toBeCalledWith(nodePath, execArgs, { stdio: 'inherit' });
  });

  it('overrides default execution extra options', () => {
    const execOpts = { stdio: 'pipe' as const };
    mockedExecaSync.mockImplementationOnce(() => ({} as never));
    execNode({ execOpts });
    expect(process.env[EK_COMMAND_ARGS]).toBe(JSON.stringify([]));
    expect(mockedExecaSync).toBeCalledWith(process.argv[0], [], execOpts);
  });

  describe('interruption on error', () => {
    it('logs error stack trace if available', () => {
      const errorMessage = 'Sint vero et ut iusto fugiat maxime aliquid.';
      const error = new Error(errorMessage);
      mockedExecaSync.mockImplementationOnce(() => {
        throw error;
      });
      mockedConsoleError.mockImplementationOnce(() => ({} as never));
      mockedProcessExit.mockImplementationOnce(() => ({} as never));
      execNode({});
      expect(mockedConsoleError.mock.calls[0][0]).toMatch(new RegExp(errorMessage));
      expect(mockedProcessExit).toBeCalledWith(1);
    });

    it('logs error itself if stack trace not available', () => {
      const error = random(1024);
      mockedExecaSync.mockImplementationOnce(() => {
        throw error;
      });
      mockedConsoleError.mockImplementationOnce(() => ({} as never));
      mockedProcessExit.mockImplementationOnce(() => ({} as never));
      execNode({});
      expect(mockedConsoleError.mock.calls[0][0]).toBe(error);
      expect(mockedProcessExit).toBeCalledWith(1);
    });
  });
});
