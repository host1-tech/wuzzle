import { EK_COMMAND_ARGS, EK_COMMAND_TYPE } from '../../constants';
import { register as registerJest24, unregister as unregisterJest24 } from '../jest__24.x';
import { register as registerWebpack4, unregister as unregisterWebpack4 } from '../webpack__4.x';
import { register, unregister } from './transform';

const commandPath = '/path/to/command';

jest.mock('@wuzzle/helpers');
jest.mock('../jest__24.x');
jest.mock('../webpack__4.x');

describe('register/unregister', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env[EK_COMMAND_ARGS];
    delete process.env[EK_COMMAND_TYPE];
  });

  it('uses webpack register on default registering', () => {
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['build']);
    register({ commandPath });
    expect(registerWebpack4).toBeCalledWith({ commandPath });
  });

  it('uses jest register on jest registering', () => {
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['test:unit']);
    process.env[EK_COMMAND_TYPE] = 'jest';
    register({ commandPath });
    expect(registerJest24).toBeCalledWith({ commandPath });
  });

  it('uses webpack register on mocha registering', () => {
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['test:unit']);
    process.env[EK_COMMAND_TYPE] = 'mocha';
    register({ commandPath });
    expect(registerWebpack4).toBeCalledWith({ commandPath });
  });

  it('uses webpack and jest unregister on unregistering', () => {
    unregister({ commandPath });
    expect(unregisterWebpack4).toBeCalledWith({ commandPath });
    expect(unregisterJest24).toBeCalledWith({ commandPath });
  });
});
