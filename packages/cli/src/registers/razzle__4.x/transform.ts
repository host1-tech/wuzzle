import { EK_COMMAND_ARGS } from '../../constants';
import { RegisterFunction } from '../../utils';
import { register as registerJest26, unregister as unregisterJest26 } from '../jest__26.x';
import { register as registerWebpack4, unregister as unregisterWebpack4 } from '../webpack__4.x';
import { register as registerWebpack5, unregister as unregisterWebpack5 } from '../webpack__5.x';

export const register: RegisterFunction = options => {
  const razzleCommand = JSON.parse(process.env[EK_COMMAND_ARGS]!)[0];
  if (razzleCommand === 'test') {
    registerJest26(options);
  } else {
    try {
      registerWebpack4(options);
    } catch {
      registerWebpack5(options);
    }
  }
};

export const unregister: RegisterFunction = options => {
  try {
    unregisterWebpack4(options);
  } catch {
    unregisterWebpack5(options);
  }
  unregisterJest26(options);
};
