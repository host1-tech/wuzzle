import { resolveRequire } from '@wuzzle/helpers';
import { mocked } from 'ts-jest/utils';
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

jest.mock('@wuzzle/helpers');
jest.mock('../utils');

describe('launchMocha', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executes with node register attached', () => {
    mocked(resolveRequire).mockReturnValueOnce(nodeRegisterPath);
    launchNode(launchOptions);
    expect(resolveRequire).toBeCalled();
    expect(mocked(execNode).mock.calls[0][0].execArgs).toEqual(
      expect.arrayContaining([nodeRegisterPath])
    );
  });
});
