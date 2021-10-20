import { EK_COMMAND_ARGS } from '../../constants';
import { register as registerJest26, unregister as unregisterJest26 } from '../jest__26.x';
import { register as registerWebpack4, unregister as unregisterWebpack4 } from '../webpack__4.x';
import { register, unregister } from './transform';

const commandPath = '/path/to/command';

jest.mock('@wuzzle/helpers');
jest.mock('../jest__26.x');
jest.mock('../webpack__4.x');

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env[EK_COMMAND_ARGS];
});

describe('register/unregister', () => {
  it('uses jest register on default registering', () => {
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['build']);
    register({ commandPath });
    expect(registerWebpack4).toBeCalledWith({ commandPath });
  });

  it('uses jest register on testing registering', () => {
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['test']);
    register({ commandPath });
    expect(registerJest26).toBeCalledWith({ commandPath });
  });

  it('uses jest unregister on default unregistering', () => {
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['build']);
    unregister({ commandPath });
    expect(unregisterWebpack4).toBeCalledWith({ commandPath });
  });

  it('uses jest unregister on testing unregistering', () => {
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['test']);
    unregister({ commandPath });
    expect(unregisterJest26).toBeCalledWith({ commandPath });
  });
});
