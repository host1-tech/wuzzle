import { EK_COMMAND_ARGS } from '../../constants';
import { RegisterFunction } from '../../utils';
import { register as registerJest26, unregister as unregisterJest26 } from '../jest__26.x';
import { register as registerWebpack4, unregister as unregisterWebpack4 } from '../webpack__4.x';

export const register: RegisterFunction = options => {
  const razzleCommand = JSON.parse(process.env[EK_COMMAND_ARGS]!)[0];
  if (razzleCommand === 'test') {
    registerJest26(options);
  } else {
    registerWebpack4(options);
  }
};

export const unregister: RegisterFunction = options => {
  unregisterWebpack4(options);
  unregisterJest26(options);
};
