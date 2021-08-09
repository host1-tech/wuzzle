import { resolveCommandPath, resolveCommandSemVer, resolveRequire } from '@wuzzle/helpers';
import { noop } from 'lodash';
import { mocked } from 'ts-jest/utils';
import {
  EK_INTERNAL_PRE_CONFIG,
  EK_REACT_SCRIPTS_SKIP_PREFLIGHT_CHECK,
  EXIT_CODE_ERROR,
} from '../constants';
import { execNode, LaunchOptions } from '../utils';
import { launchReactScripts } from './react-scripts';

const commandName = 'commandName';
const launchOptions: LaunchOptions = {
  nodePath: '/path/to/node',
  args: [],
  projectPath: '/path/to/project',
  commandName,
};
const reactScriptsRegisterPath = '/path/to/register/react-scripts';
const reactScriptsPreConfigPath = '/path/to/pre-config/react-scripts';

jest.mock('@wuzzle/helpers');
jest.mock('../utils');
jest.spyOn(console, 'error').mockImplementation(noop);
jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});
mocked(resolveCommandSemVer).mockReturnValue({} as never);

describe('launchReactScripts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env[EK_INTERNAL_PRE_CONFIG];
  });

  it('executes with register attached and pre config set if command resolved', () => {
    mocked(resolveRequire).mockReturnValueOnce(reactScriptsRegisterPath);
    mocked(resolveRequire).mockReturnValueOnce(reactScriptsPreConfigPath);
    launchReactScripts(launchOptions);
    expect(resolveCommandPath).toBeCalled();
    expect(resolveCommandSemVer).toBeCalled();
    expect(resolveRequire).toBeCalled();
    expect(mocked(execNode).mock.calls[0][0].execArgs).toEqual(
      expect.arrayContaining([reactScriptsRegisterPath])
    );
    expect(process.env[EK_INTERNAL_PRE_CONFIG]).toBe(reactScriptsPreConfigPath);
    expect(process.env[EK_REACT_SCRIPTS_SKIP_PREFLIGHT_CHECK]).toBe('true');
  });

  it('exits with error code and error message if command not resolved', () => {
    mocked(resolveCommandPath).mockImplementationOnce(() => {
      throw 0;
    });
    try {
      launchReactScripts(launchOptions);
    } catch {}
    expect(console.error).toBeCalledWith(expect.stringContaining(commandName));
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
    expect(execNode).not.toBeCalled();
  });
});
