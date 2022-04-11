import { logError } from '@wuzzle/helpers';
import execa from 'execa';
import { noop } from 'lodash';
import { mocked } from 'ts-jest/utils';
import { EXIT_CODE_ERROR } from '../constants';
import { execNode } from './exec-node';

jest.mock('@wuzzle/helpers');

jest.spyOn(execa, 'sync').mockImplementation(noop as never);
jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});

describe('execNode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('works with default options', () => {
    execNode({});
    expect(execa.sync).toBeCalledWith(process.argv[0], [], {
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit',
    });
  });

  it('works with specified input', () => {
    const nodePath = '/path/to/node';
    const execArgs = ['--verbose'];
    const execOpts = { shell: true } as const;
    execNode({ nodePath, execArgs, execOpts });
    expect(execa.sync).toBeCalledWith(nodePath, execArgs, expect.objectContaining(execOpts));
  });

  it('resolves io param conflict', () => {
    const execOpts = { stdio: 'pipe' } as const;
    execNode({ execOpts });
    ['stdin', 'stdout', 'stderr'].forEach(k => {
      expect(execa.sync).toBeCalledWith(
        expect.anything(),
        expect.anything(),
        expect.not.objectContaining({ [k]: expect.anything() })
      );
    });
  });

  it('terminates process w/o error reported if interrupted w/ stderr inherited', () => {
    mocked(execa.sync).mockImplementationOnce(() => {
      throw 0;
    });
    try {
      execNode({});
    } catch {}
    expect(logError).not.toBeCalled();
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
  });

  it('terminates process w/ error reported if interrupted w/o stderr inherited', () => {
    const execOptsListToVerify = [
      { stderr: 'pipe' },
      { stdio: 'pipe' },
      { stdio: ['pipe', 'pipe', 'pipe'] },
    ] as const;
    execOptsListToVerify.forEach((execOpts, i) => {
      mocked(execa.sync).mockImplementationOnce(() => {
        throw i;
      });
      try {
        execNode({ execOpts });
      } catch {}
      const nth = i + 1;
      expect(logError).toHaveBeenNthCalledWith(nth, i);
      expect(process.exit).toHaveBeenNthCalledWith(nth, EXIT_CODE_ERROR);
    });
  });
});
