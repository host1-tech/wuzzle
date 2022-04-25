import { EK } from '../../constants';
import { envGet, RegisterFunction, UnregisterFunction } from '../../utils';
import { register as registerJest26, unregister as unregisterJest26 } from '../jest__26.x';
import { register as registerWebpack4, unregister as unregisterWebpack4 } from '../webpack__4.x';

export const register: RegisterFunction = options => {
  const reactScriptsSubCommand = envGet(EK.COMMAND_ARGS)[0];
  if (reactScriptsSubCommand === 'test') {
    registerJest26(options);
  } else {
    registerWebpack4(options);
  }
};

export const unregister: UnregisterFunction = options => {
  unregisterWebpack4(options);
  unregisterJest26(options);
};
