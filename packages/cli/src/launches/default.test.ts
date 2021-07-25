import { resolveCommandPath, resolveRequire, resolveWebpackSemVer } from '@wuzzle/helpers';
import { noop } from 'lodash';
import { mocked } from 'ts-jest/utils';
import { EXIT_CODE_ERROR } from '../constants';
import { execNode, LaunchOptions } from '../utils';
import { launchDefault } from './default';

const commandName = 'commandName';
const launchOptions: LaunchOptions = {
  nodePath: '/path/to/node',
  args: [],
  projectPath: '/path/to/project',
  commandName,
};
const webpackRegisterPath = '/path/to/register/webpack';

jest.mock('@wuzzle/helpers');
jest.mock('../utils');
jest.spyOn(console, 'error').mockImplementation(noop);
jest.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('asdf');
});
mocked(resolveWebpackSemVer).mockReturnValue({} as never);

describe('launchDefault', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executes with webpack register attached if command resolved', () => {
    mocked(resolveRequire).mockReturnValueOnce(webpackRegisterPath);
    launchDefault(launchOptions);
    expect(resolveCommandPath).toBeCalled();
    expect(resolveWebpackSemVer).toBeCalled();
    expect(resolveRequire).toBeCalled();
    expect(mocked(execNode).mock.calls[0][0].execArgs).toEqual(
      expect.arrayContaining([webpackRegisterPath])
    );
  });

  it('exits with error code and error message if command not resolved', () => {
    mocked(resolveCommandPath).mockImplementationOnce(() => {
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
