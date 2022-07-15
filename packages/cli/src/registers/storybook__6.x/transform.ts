import path from 'path';

import { logError, resolveRequire } from '@wuzzle/helpers';

import { EXIT_CODE_ERROR } from '../../constants';
import { RegisterFunction, UnregisterFunction } from '../../utils';
import { register as registerWebpack4, unregister as unregisterWebpack4 } from '../webpack__4.x';
import { register as registerWebpack5, unregister as unregisterWebpack5 } from '../webpack__5.x';

export const register: RegisterFunction = options => {
  let didRegister: boolean = false;
  for (const [storybookManagerWebpackId, registerWebpack] of [
    ['@storybook/manager-webpack4', registerWebpack4],
    ['@storybook/manager-webpack5', registerWebpack5],
  ] as const) {
    try {
      const storybookManagerWebpackPath = resolveRequire(storybookManagerWebpackId, {
        basedir: path.dirname(options.commandPath),
      });
      registerWebpack({ ...options, commandPath: storybookManagerWebpackPath });
      didRegister = true;
    } catch {}
  }
  if (!didRegister) {
    logError(`error: failed to register for 'storybook@6.x'.`);
    process.exit(EXIT_CODE_ERROR);
  }
};

export const unregister: UnregisterFunction = options => {
  for (const [storybookManagerWebpackId, unregisterWebpack] of [
    ['@storybook/manager-webpack4', unregisterWebpack4],
    ['@storybook/manager-webpack5', unregisterWebpack5],
  ] as const) {
    const storybookManagerWebpackPath = resolveRequire(storybookManagerWebpackId, {
      basedir: path.dirname(options.commandPath),
    });
    unregisterWebpack({ ...options, commandPath: storybookManagerWebpackPath });
  }
};
