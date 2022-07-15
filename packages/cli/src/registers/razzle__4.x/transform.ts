import { EK } from '../../constants';
import { envGet, RegisterFunction, UnregisterFunction } from '../../utils';
import { register as registerJest26, unregister as unregisterJest26 } from '../jest__26.x';
import { register as registerWebpack4, unregister as unregisterWebpack4 } from '../webpack__4.x';
import { register as registerWebpack5, unregister as unregisterWebpack5 } from '../webpack__5.x';

export const register: RegisterFunction = options => {
  const razzleSubCommand = envGet(EK.COMMAND_ARGS)[0];
  if (razzleSubCommand === 'test') {
    registerJest26(options);
  } else {
    try {
      registerWebpack4(options);
    } catch {
      registerWebpack5(options);
    }
  }
};

export const unregister: UnregisterFunction = options => {
  unregisterWebpack4(options);
  unregisterWebpack5(options);
  unregisterJest26(options);
};
