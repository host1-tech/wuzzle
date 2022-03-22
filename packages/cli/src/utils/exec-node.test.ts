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
    expect(execa.sync).toBeCalledWith(process.argv[0], [], { stdio: 'inherit' });
  });

  it('uses args as execution args by default', () => {
    const nodePath = '/path/to/node';
    const args = ['--verbose'];
    execNode({ nodePath, args });
    expect(execa.sync).toBeCalledWith(nodePath, args, { stdio: 'inherit' });
  });

  it('overrides execution args with execArgs', () => {
    const nodePath = '/path/to/node';
    const args = ['--verbose'];
    const execArgs = ['--help'];
    execNode({ nodePath, args, execArgs });
    expect(execa.sync).toBeCalledWith(nodePath, execArgs, { stdio: 'inherit' });
  });

  it('overrides default execution extra options', () => {
    const execOpts = { stdio: 'pipe' as const };
    execNode({ execOpts });
    expect(execa.sync).toBeCalledWith(process.argv[0], [], execOpts);
  });

  it('logs error on interrupted by error', () => {
    const error = new Error('message');
    mocked(execa.sync).mockImplementationOnce(() => {
      throw error;
    });
    try {
      execNode({});
    } catch {}
    expect(logError).toBeCalledWith(error);
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
  });
});
