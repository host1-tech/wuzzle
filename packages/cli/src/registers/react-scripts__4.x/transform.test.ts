import { mocked } from 'ts-jest/utils';

import { envGet } from '../../utils';
import { register as registerJest26, unregister as unregisterJest26 } from '../jest__26.x';
import { register as registerWebpack4, unregister as unregisterWebpack4 } from '../webpack__4.x';
import { register, unregister } from './transform';

const commandPath = '/path/to/command';

jest.mock('@wuzzle/helpers');
jest.mock('../../utils', () => ({ ...jest.requireActual('../../utils'), envGet: jest.fn() }));
jest.mock('../jest__26.x');
jest.mock('../webpack__4.x');

mocked(envGet).mockReturnValue([]);

describe('register/unregister', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses webpack register on default registering', () => {
    mocked(envGet).mockReturnValueOnce(['build']);
    register({ commandPath });
    expect(registerWebpack4).toBeCalledWith({ commandPath });
  });

  it('uses jest register on testing registering', () => {
    mocked(envGet).mockReturnValueOnce(['test']);
    register({ commandPath });
    expect(registerJest26).toBeCalledWith({ commandPath });
  });

  it('uses webpack and jest unregister on unregistering', () => {
    unregister({ commandPath });
    expect(unregisterWebpack4).toBeCalledWith({ commandPath });
    expect(unregisterJest26).toBeCalledWith({ commandPath });
  });
});
