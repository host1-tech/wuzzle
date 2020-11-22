import { diff, stringify } from '@wuzzle/helpers';
import { cosmiconfigSync } from 'cosmiconfig';
import type webpack from 'webpack';

const debug = require('debug')('@wuzzle/cli:applyConfig');

const configExplorer = cosmiconfigSync('wuzzle');

export type WuzzleConfigModify = (
  webpackConfig: webpack.Configuration
) => webpack.Configuration | void;

export interface WuzzleConfigOptions {
  modify?: WuzzleConfigModify;
}

export type WuzzleConfig = WuzzleConfigModify | WuzzleConfigOptions;

function applyConfig(webpackConfig: webpack.Configuration): webpack.Configuration {
  debug('Wuzzle process mounted in CWD:', process.cwd());
  const webpackConfigOldSnapshot = stringify(webpackConfig);

  const optionsToUse: WuzzleConfigOptions = {};

  const configLoaded = configExplorer.search()?.config || {};
  if (typeof configLoaded == 'function') {
    optionsToUse.modify = configLoaded;
  } else {
    Object.assign(optionsToUse, configLoaded);
  }
  debug('Wuzzle config to apply:', stringify(configLoaded));

  if (optionsToUse.modify) {
    try {
      const newWebpackConfig = optionsToUse.modify(webpackConfig);
      if (newWebpackConfig) {
        webpackConfig = newWebpackConfig;
      }
    } catch {}
  }

  const webpackConfigNewSnapshot = stringify(webpackConfig);

  debug('Webpack config changed:', diff(webpackConfigOldSnapshot, webpackConfigNewSnapshot));
  return webpackConfig;
}

export default applyConfig;
