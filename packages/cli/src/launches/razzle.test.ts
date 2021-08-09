import { resolveCommandPath, resolveRequire } from '@wuzzle/helpers';
import { noop } from 'lodash';
import { mocked } from 'ts-jest/utils';
import { EK_INTERNAL_PRE_CONFIG, EXIT_CODE_ERROR } from '../constants';
import { execNode, LaunchOptions } from '../utils';
import { launchRazzle } from './razzle';

const commandName = 'commandName';
const launchOptions: LaunchOptions = {
  nodePath: '/path/to/node',
  args: [],
  projectPath: '/path/to/project',
  commandName,
};
const razzleRegisterPath = '/path/to/register/razzle';
const razzlePreConfigPath = '/path/to/pre-config/razzle';

jest.mock('@wuzzle/helpers');
jest.mock('../utils');
jest.spyOn(console, 'error').mockImplementation(noop);
jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});

describe('launchRazzle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env[EK_INTERNAL_PRE_CONFIG];
  });

  it('executes with register attached and pre config set if command resolved', () => {
    mocked(resolveRequire).mockReturnValueOnce(razzleRegisterPath);
    mocked(resolveRequire).mockReturnValueOnce(razzlePreConfigPath);
    launchRazzle(launchOptions);
    expect(resolveCommandPath).toBeCalled();
    expect(resolveRequire).toBeCalled();
    expect(mocked(execNode).mock.calls[0][0].execArgs).toEqual(
      expect.arrayContaining([razzleRegisterPath])
    );
    expect(process.env[EK_INTERNAL_PRE_CONFIG]).toBe(razzlePreConfigPath);
  });

  it('exits with error code and error message if command not resolved', () => {
    mocked(resolveCommandPath).mockImplementationOnce(() => {
      throw 0;
    });
    try {
      launchRazzle(launchOptions);
    } catch {}
    expect(console.error).toBeCalledWith(expect.stringContaining(commandName));
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
    expect(execNode).not.toBeCalled();
  });
});
