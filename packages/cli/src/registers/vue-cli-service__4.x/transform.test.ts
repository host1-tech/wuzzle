import { mocked } from 'ts-jest/utils';

import { EK } from '../../constants';
import { envGet, envGetDefault } from '../../utils';
import { register as registerCypress7, unregister as unregisterCypress7 } from '../cypress__7.x';
import { register as registerJest24, unregister as unregisterJest24 } from '../jest__24.x';
import { register as registerWebpack4, unregister as unregisterWebpack4 } from '../webpack__4.x';
import { register, unregister } from './transform';

const commandPath = '/path/to/command';

jest.mock('@wuzzle/helpers');
jest.mock('../../utils', () => ({ ...jest.requireActual('../../utils'), envGet: jest.fn() }));
jest.mock('../webpack__4.x');
jest.mock('../jest__24.x');
jest.mock('../cypress__7.x');
jest.mock('../webpack__4.x');

const envGetCommandArgs = jest.fn(envGet).mockReturnValue(envGetDefault(EK.COMMAND_ARGS));
const envGetCommandType = jest.fn(envGet).mockReturnValue(envGetDefault(EK.COMMAND_TYPE));
mocked(envGet).mockImplementation(ek => {
  if (ek === EK.COMMAND_ARGS) {
    return envGetCommandArgs(ek);
  } else if (ek === EK.COMMAND_TYPE) {
    return envGetCommandType(ek);
  }
});

describe('register/unregister', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses webpack register on default registering', () => {
    envGetCommandArgs.mockReturnValueOnce(['build']);
    register({ commandPath });
    expect(registerWebpack4).toBeCalledWith({ commandPath });
  });

  it('uses cypress register on cypress registering', () => {
    envGetCommandArgs.mockReturnValueOnce(['test:e2e']);
    envGetCommandType.mockReturnValueOnce('cypress');
    register({ commandPath });
    expect(registerCypress7).toBeCalledWith({ commandPath });
  });

  it('uses jest register on jest registering', () => {
    envGetCommandArgs.mockReturnValueOnce(['test:unit']);
    envGetCommandType.mockReturnValueOnce('jest');
    register({ commandPath });
    expect(registerJest24).toBeCalledWith({ commandPath });
  });

  it('uses webpack and jest unregister on unregistering', () => {
    unregister({ commandPath });
    expect(unregisterWebpack4).toBeCalledWith({ commandPath });
    expect(unregisterCypress7).toBeCalledWith({ commandPath });
    expect(unregisterJest24).toBeCalledWith({ commandPath });
  });
});
