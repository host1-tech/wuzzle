import { mocked } from 'ts-jest/utils';

import { envGet } from '../../utils';
import { register as registerJest27, unregister as unregisterJest27 } from '../jest__27.x';
import { register as registerWebpack5, unregister as unregisterWebpack5 } from '../webpack__5.x';
import { register, unregister } from './transform';

const commandPath = '/path/to/command';

jest.mock('@wuzzle/helpers');
jest.mock('../../utils', () => ({ ...jest.requireActual('../../utils'), envGet: jest.fn() }));
jest.mock('../jest__27.x');
jest.mock('../webpack__5.x');

mocked(envGet).mockReturnValue([]);

describe('register/unregister', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses webpack register on default registering', () => {
    mocked(envGet).mockReturnValueOnce(['build']);
    register({ commandPath });
    expect(registerWebpack5).toBeCalledWith({ commandPath });
  });

  it('uses jest register on testing registering', () => {
    mocked(envGet).mockReturnValueOnce(['test']);
    register({ commandPath });
    expect(registerJest27).toBeCalledWith({ commandPath });
  });

  it('uses webpack and jest unregister on unregistering', () => {
    unregister({ commandPath });
    expect(unregisterWebpack5).toBeCalledWith({ commandPath });
    expect(unregisterJest27).toBeCalledWith({ commandPath });
  });
});
