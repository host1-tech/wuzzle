import { logError, resolveRequire } from '@wuzzle/helpers';
import path from 'path';
import { EK_DRY_RUN, EK_PROJECT_PATH, EXIT_CODE_ERROR } from '../../constants';
import { RegisterFunction, RegisterOptions, UnregisterFunction } from '../../utils';
import { register as registerWebpack4, unregister as unregisterWebpack4 } from '../webpack__4.x';
import { register as registerWebpack5, unregister as unregisterWebpack5 } from '../webpack__5.x';
import applyConfig from '../../apply-config';

export const register: RegisterFunction = options => {
  try {
    resolveRequire('@cypress/webpack-preprocessor', { basedir: process.env[EK_PROJECT_PATH] });
  } catch (e) {
    logError(`error: package '@cypress/webpack-preprocessor' not installed.`);
    process.exit(EXIT_CODE_ERROR);
  }

  if (process.env[EK_DRY_RUN]) {
    printDryRunLog(options);
    process.exit();
  }

  try {
    registerWebpack4(options);
  } catch {
    registerWebpack5(options);
  }
};

export const unregister: UnregisterFunction = options => {
  try {
    unregisterWebpack4(options);
  } catch {
    unregisterWebpack5(options);
  }
};

export function printDryRunLog({ commandPath }: RegisterOptions): void {
  const {
    defaultOptions: { webpackOptions: webpackConfig },
  } = require(resolveRequire('@cypress/webpack-preprocessor', {
    basedir: process.env[EK_PROJECT_PATH],
  }));
  const webpack = require(resolveRequire('webpack', {
    basedir: path.dirname(commandPath),
  }));
  applyConfig(webpackConfig, webpack);
}
