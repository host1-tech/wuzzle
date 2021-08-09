import { resolveCommandPath, resolveRequire } from '@wuzzle/helpers';
import { noop } from 'lodash';
import { mocked } from 'ts-jest/utils';
import { EK_INTERNAL_PRE_CONFIG, EXIT_CODE_ERROR } from '../constants';
import { execNode, LaunchOptions } from '../utils';
import { launchMocha } from './mocha';

const commandName = 'commandName';
const launchOptions: LaunchOptions = {
  nodePath: '/path/to/node',
  args: [],
  projectPath: '/path/to/project',
  commandName,
};
const nodeRegisterPath = '/path/to/register/node';
const nodePreConfigPath = '/path/to/pre-config/node';

jest.mock('@wuzzle/helpers');
jest.mock('../utils');
jest.spyOn(console, 'error').mockImplementation(noop);
jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});

describe('launchMocha', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executes with node register attached if command resolved', () => {
    mocked(resolveRequire).mockReturnValueOnce(nodeRegisterPath);
    mocked(resolveRequire).mockReturnValueOnce(nodePreConfigPath);
    launchMocha(launchOptions);
    expect(resolveCommandPath).toBeCalled();
    expect(resolveRequire).toBeCalled();
    expect(mocked(execNode).mock.calls[0][0].execArgs).toEqual(
      expect.arrayContaining([nodeRegisterPath])
    );
    expect(process.env[EK_INTERNAL_PRE_CONFIG]).toBe(nodePreConfigPath);
  });

  it('exits with error code and error message if command not resolved', () => {
    mocked(resolveCommandPath).mockImplementationOnce(() => {
      throw 0;
    });
    try {
      launchMocha(launchOptions);
    } catch {}
    expect(console.error).toBeCalledWith(expect.stringContaining(commandName));
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
    expect(execNode).not.toBeCalled();
  });
});
