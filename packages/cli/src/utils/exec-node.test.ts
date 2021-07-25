import execa from 'execa';
import { noop, random } from 'lodash';
import { mocked } from 'ts-jest/utils';
import { EK_COMMAND_ARGS, EXIT_CODE_ERROR } from '../constants';
import { execNode } from './exec-node';

jest.spyOn(execa, 'sync').mockImplementation(noop as never);
jest.spyOn(console, 'error').mockImplementation(noop);
jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});

describe('execNode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env[EK_COMMAND_ARGS];
  });

  it('works with default options', () => {
    execNode({});
    expect(process.env[EK_COMMAND_ARGS]).toBe(JSON.stringify([]));
    expect(execa.sync).toBeCalledWith(process.argv[0], [], { stdio: 'inherit' });
  });

  it('uses args as execution args by default', () => {
    const nodePath = '/path/to/node';
    const args = ['--verbose'];
    execNode({ nodePath, args });
    expect(process.env[EK_COMMAND_ARGS]).toBe(JSON.stringify(args));
    expect(execa.sync).toBeCalledWith(nodePath, args, { stdio: 'inherit' });
  });

  it('overrides execution args with execArgs', () => {
    const nodePath = '/path/to/node';
    const args = ['--verbose'];
    const execArgs = ['--help'];
    execNode({ nodePath, args, execArgs });
    expect(process.env[EK_COMMAND_ARGS]).toBe(JSON.stringify(args));
    expect(execa.sync).toBeCalledWith(nodePath, execArgs, { stdio: 'inherit' });
  });

  it('overrides default execution extra options', () => {
    const execOpts = { stdio: 'pipe' as const };
    execNode({ execOpts });
    expect(process.env[EK_COMMAND_ARGS]).toBe(JSON.stringify([]));
    expect(execa.sync).toBeCalledWith(process.argv[0], [], execOpts);
  });

  describe('interruption on error', () => {
    it('logs error stack trace if available', () => {
      const errorMessage = 'Sint vero et ut iusto fugiat maxime aliquid.';
      const error = new Error(errorMessage);
      mocked(execa.sync).mockImplementationOnce(() => {
        throw error;
      });
      try {
        execNode({});
      } catch {}
      expect(mocked(console.error).mock.calls[0][0]).toMatch(new RegExp(errorMessage));
      expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
    });

    it('logs error itself if stack trace not available', () => {
      const error = random(1024);
      mocked(execa.sync).mockImplementationOnce(() => {
        throw error;
      });
      try {
        execNode({});
      } catch {}
      expect(mocked(console.error).mock.calls[0][0]).toBe(error);
      expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
    });
  });
});
