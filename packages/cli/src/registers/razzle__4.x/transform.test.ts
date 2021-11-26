import { mocked } from 'ts-jest/utils';
import { EK_COMMAND_ARGS } from '../../constants';
import { register as registerJest26, unregister as unregisterJest26 } from '../jest__26.x';
import { register as registerWebpack4, unregister as unregisterWebpack4 } from '../webpack__4.x';
import { register as registerWebpack5, unregister as unregisterWebpack5 } from '../webpack__5.x';
import { register, unregister } from './transform';

const commandPath = '/path/to/command';

jest.mock('@wuzzle/helpers');
jest.mock('../jest__26.x');
jest.mock('../webpack__4.x');
jest.mock('../webpack__5.x');

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env[EK_COMMAND_ARGS];
});

describe('register/unregister', () => {
  it('uses webpack 4 register on default registering', () => {
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['build']);
    register({ commandPath });
    expect(registerWebpack4).toBeCalledWith({ commandPath });
  });

  it('uses webpack 5 register on default registering if webpack 4 registering fails', () => {
    mocked(registerWebpack4).mockImplementationOnce(() => {
      throw 0;
    });
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['build']);
    register({ commandPath });
    expect(registerWebpack5).toBeCalledWith({ commandPath });
  });

  it('uses jest register on testing registering', () => {
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['test']);
    register({ commandPath });
    expect(registerJest26).toBeCalledWith({ commandPath });
  });

  it('uses webpack 4 and jest unregister on unregistering', () => {
    unregister({ commandPath });
    expect(unregisterWebpack4).toBeCalledWith({ commandPath });
    expect(unregisterJest26).toBeCalledWith({ commandPath });
  });

  it('uses webpack 5 and jest unregister on unregistering if webpack 4 unregistering fails', () => {
    mocked(unregisterWebpack4).mockImplementationOnce(() => {
      throw 0;
    });
    unregister({ commandPath });
    expect(unregisterWebpack5).toBeCalledWith({ commandPath });
    expect(unregisterJest26).toBeCalledWith({ commandPath });
  });
});
