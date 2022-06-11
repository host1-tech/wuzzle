import { mocked } from 'ts-jest/utils';

import { resolveRequire } from '@wuzzle/helpers';

import { applyNodeLikeExtraOptions, execNode, LaunchOptions } from '../utils';
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

mocked(applyNodeLikeExtraOptions).mockReturnValue({
  applyPreCompilation: jest.fn(),
});

describe('launchNode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executes with node register attached', async () => {
    mocked(resolveRequire).mockReturnValueOnce(nodeRegisterPath);
    await launchNode(launchOptions);
    expect(resolveRequire).toBeCalled();
    expect(execNode).toBeCalledWith(
      expect.objectContaining({
        execArgs: expect.arrayContaining([nodeRegisterPath]),
      })
    );
  });
});
