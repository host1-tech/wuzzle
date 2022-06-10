import { logError, logPlain, resolveCommandPath, resolveRequire } from '@wuzzle/helpers';
import { noop } from 'lodash';
import { mocked } from 'ts-jest/utils';
import { EXIT_CODE_ERROR } from '../constants';
import {
  doFileRegistering,
  execNode,
  FileRegisteringOptions,
  LaunchOptions,
  tmplLogForGlobalResolving,
} from '../utils';
import { launchStorybook } from './storybook';

const commandName = 'commandName';
const commandPath = '/path/to/command';
const launchOptions: LaunchOptions = {
  nodePath: '/path/to/node',
  args: [],
  projectPath: '/path/to/project',
  commandName,
};
const logForGlobalResolving = 'log for global resolving';
const frOptionsList: FileRegisteringOptions[] = [4, 5].map(majorVersion => ({
  registerName: 'webpack',
  majorVersion,
  attempts: 1,
  throwErr: true,
  commandPath: `@storybook/manager-webpack${majorVersion}`,
}));

jest.mock('@wuzzle/helpers');
jest.mock('../utils');
jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});
mocked(tmplLogForGlobalResolving).mockReturnValue(logForGlobalResolving);
mocked(resolveRequire).mockImplementation(id => id);

describe('launchStorybook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocked(doFileRegistering).mockImplementation(noop);
    mocked(resolveCommandPath).mockReturnValue(commandPath);
  });

  it('executes with webpack register attached if command resolved', () => {
    launchStorybook(launchOptions);
    expect(resolveCommandPath).toBeCalled();
    frOptionsList.forEach((frOpt, i) => {
      const nth = i + 1;
      expect(doFileRegistering).toHaveBeenNthCalledWith(nth, frOpt);
    });
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
    launchStorybook(launchOptions);
    expect(resolveCommandPath).toBeCalledWith(expect.objectContaining({ fromGlobals: true }));
    expect(logPlain).toBeCalledWith(logForGlobalResolving);
    frOptionsList.forEach((frOpt, i) => {
      const nth = i + 1;
      expect(doFileRegistering).toHaveBeenNthCalledWith(nth, frOpt);
    });
    expect(execNode).toBeCalledWith(
      expect.objectContaining({
        execArgs: expect.arrayContaining([commandPath]),
      })
    );
  });

  it('reports error and termiates process if command not resolved', () => {
    mocked(resolveCommandPath).mockImplementation(() => {
      throw 0;
    });
    try {
      launchStorybook(launchOptions);
    } catch {}
    expect(logError).toBeCalledWith(expect.stringContaining(commandName));
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
    expect(execNode).not.toBeCalled();
  });

  it('reports error and termiates process if all file registering tries fail', () => {
    mocked(doFileRegistering).mockImplementation(() => {
      throw 0;
    });
    try {
      launchStorybook(launchOptions);
    } catch {}
    expect(logError).toBeCalledWith(expect.stringContaining(commandName));
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
    expect(execNode).not.toBeCalled();
  });
});
