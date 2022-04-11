import { EK_COMMAND_ARGS, EK_COMMAND_TYPE } from '../../constants';
import { RegisterFunction, UnregisterFunction } from '../../utils';
import { register as registerJest24, unregister as unregisterJest24 } from '../jest__24.x';
import { register as registerCypress7, unregister as unregisterCypress7 } from '../cypress__7.x';
import { register as registerWebpack4, unregister as unregisterWebpack4 } from '../webpack__4.x';

export const register: RegisterFunction = options => {
  const vueCliServiceSubCommand = JSON.parse(process.env[EK_COMMAND_ARGS]!)[0];
  const vueCliServiceCommandType = process.env[EK_COMMAND_TYPE];
  if (vueCliServiceSubCommand === 'test:unit' && vueCliServiceCommandType === 'jest') {
    registerJest24(options);
  } else if (vueCliServiceSubCommand === 'test:e2e' && vueCliServiceCommandType === 'cypress') {
    registerCypress7(options);
  } else {
    registerWebpack4(options);
  }
};

export const unregister: UnregisterFunction = options => {
  unregisterWebpack4(options);
  unregisterCypress7(options);
  unregisterJest24(options);
};
