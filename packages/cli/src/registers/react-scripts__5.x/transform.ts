import { EK } from '../../constants';
import { envGet, RegisterFunction, UnregisterFunction } from '../../utils';
import { register as registerJest27, unregister as unregisterJest27 } from '../jest__27.x';
import { register as registerWebpack5, unregister as unregisterWebpack5 } from '../webpack__5.x';

export const register: RegisterFunction = options => {
  const reactScriptsSubCommand = envGet(EK.COMMAND_ARGS)[0];
  if (reactScriptsSubCommand === 'test') {
    registerJest27(options);
  } else {
    registerWebpack5(options);
  }
};

export const unregister: UnregisterFunction = options => {
  unregisterWebpack5(options);
  unregisterJest27(options);
};
