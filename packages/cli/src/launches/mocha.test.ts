import { mocked } from 'ts-jest/utils';

import { logError, logPlain, resolveCommandPath, resolveRequire } from '@wuzzle/helpers';

import { EXIT_CODE_ERROR } from '../constants';
import {
  applyNodeLikeExtraOptions,
  execNode,
  LaunchOptions,
  tmplLogForGlobalResolving,
} from '../utils';
import { launchMocha } from './mocha';

const commandName = 'commandName';
const logForGlobalResolving = 'log for global resolving';
const launchOptions: LaunchOptions = {
  nodePath: '/path/to/node',
  args: [],
  projectPath: '/path/to/project',
  commandName,
};
const nodeRegisterPath = '/path/to/register/node';

jest.mock('@wuzzle/helpers');
jest.mock('../utils');
jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});

mocked(applyNodeLikeExtraOptions).mockReturnValue({
  applyPreCompilation: jest.fn(),
});
mocked(tmplLogForGlobalResolving).mockReturnValue(logForGlobalResolving);

describe('launchMocha', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executes with node register attached if command resolved', async () => {
    mocked(resolveRequire).mockReturnValueOnce(nodeRegisterPath);
    await launchMocha(launchOptions);
    expect(resolveCommandPath).toBeCalled();
    expect(execNode).toBeCalledWith(
      expect.objectContaining({
        execArgs: expect.arrayContaining([nodeRegisterPath]),
      })
    );
  });

  it('resolves webpack global if command not resolved from locals', async () => {
    mocked(resolveCommandPath).mockImplementationOnce(() => {
      throw 0;
    });
    mocked(resolveRequire).mockReturnValueOnce(nodeRegisterPath);
    await launchMocha(launchOptions);
    expect(resolveCommandPath).toBeCalledWith(expect.objectContaining({ fromGlobals: true }));
    expect(logPlain).toBeCalledWith(logForGlobalResolving);
    expect(execNode).toBeCalledWith(
      expect.objectContaining({
        execArgs: expect.arrayContaining([nodeRegisterPath]),
      })
    );
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
      await launchMocha(launchOptions);
    } catch {}
    expect(logError).toBeCalledWith(expect.stringContaining(commandName));
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
    expect(execNode).not.toBeCalled();
  });
});
