import { EK_COMMAND_ARGS } from '../../constants';
import { RegisterFunction } from '../../utils';
import { register as registerJest24, unregister as unregisterJest24 } from '../jest__24.x';
import { register as registerWebpack4, unregister as unregisterWebpack4 } from '../webpack__4.x';

export const register: RegisterFunction = options => {
  const razzleSubCommand = JSON.parse(process.env[EK_COMMAND_ARGS]!)[0];
  if (razzleSubCommand === 'test') {
    registerJest24(options);
  } else {
    registerWebpack4(options);
  }
};

export const unregister: RegisterFunction = options => {
  unregisterWebpack4(options);
  unregisterJest24(options);
};
