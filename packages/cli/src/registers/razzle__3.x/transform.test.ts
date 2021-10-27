import { EK_COMMAND_ARGS } from '../../constants';
import { register as registerJest24, unregister as unregisterJest24 } from '../jest__24.x';
import { register as registerWebpack4, unregister as unregisterWebpack4 } from '../webpack__4.x';
import { register, unregister } from './transform';

const commandPath = '/path/to/command';

jest.mock('@wuzzle/helpers');
jest.mock('../jest__24.x');
jest.mock('../webpack__4.x');

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env[EK_COMMAND_ARGS];
});

describe('register/unregister', () => {
  it('uses webpack register on default registering', () => {
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['build']);
    register({ commandPath });
    expect(registerWebpack4).toBeCalledWith({ commandPath });
  });

  it('uses jest register on testing registering', () => {
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['test']);
    register({ commandPath });
    expect(registerJest24).toBeCalledWith({ commandPath });
  });

  it('uses webpack and jest unregister on unregistering', () => {
    unregister({ commandPath });
    expect(unregisterWebpack4).toBeCalledWith({ commandPath });
    expect(unregisterJest24).toBeCalledWith({ commandPath });
  });
});
