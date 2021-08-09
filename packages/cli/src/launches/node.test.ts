import { resolveRequire } from '@wuzzle/helpers';
import { mocked } from 'ts-jest/utils';
import { EK_INTERNAL_PRE_CONFIG } from '../constants';
import { execNode, LaunchOptions } from '../utils';
import { launchNode } from './node';

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

describe('launchMocha', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executes with node register attached', () => {
    mocked(resolveRequire).mockReturnValueOnce(nodeRegisterPath);
    mocked(resolveRequire).mockReturnValueOnce(nodePreConfigPath);
    launchNode(launchOptions);
    expect(resolveRequire).toBeCalled();
    expect(mocked(execNode).mock.calls[0][0].execArgs).toEqual(
      expect.arrayContaining([nodeRegisterPath])
    );
    expect(process.env[EK_INTERNAL_PRE_CONFIG]).toBe(nodePreConfigPath);
  });
});
