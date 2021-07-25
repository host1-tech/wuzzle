import { diff, stringify } from '@wuzzle/helpers';
import { cosmiconfigSync } from 'cosmiconfig';
import debugFty from 'debug';
import type webpack from 'webpack';
import { EK_INTERNAL_PRE_CONFIG } from './constants';

const debug = debugFty('@wuzzle/cli:applyConfig');

export type WuzzleConfigModify = (
  webpackConfig: webpack.Configuration
) => webpack.Configuration | void;

export interface WuzzleConfigOptions {
  modify?: WuzzleConfigModify;
}

export type WuzzleConfig = WuzzleConfigModify | WuzzleConfigOptions;

function applyConfig(webpackConfig: webpack.Configuration): webpack.Configuration {
  debug('Wuzzle process mounted in CWD:', process.cwd());
  const wuzzleConfigExplorer = cosmiconfigSync('wuzzle');

  const internalPreConfigPath = process.env[EK_INTERNAL_PRE_CONFIG];
  if (internalPreConfigPath) {
    try {
      const internalPreConfig: WuzzleConfigModify = require(internalPreConfigPath).default;
      Object.assign(webpackConfig, internalPreConfig(webpackConfig));
    } catch {}
  }

  const webpackConfigOldSnapshot = stringify(webpackConfig);

  const optionsToUse: WuzzleConfigOptions = {};

  const configLoaded = wuzzleConfigExplorer.search()?.config || {};
  if (typeof configLoaded === 'function') {
    optionsToUse.modify = configLoaded;
  } else {
    Object.assign(optionsToUse, configLoaded);
  }
  debug('Wuzzle config to apply:', stringify(configLoaded));

  if (optionsToUse.modify) {
    try {
      Object.assign(webpackConfig, optionsToUse.modify(webpackConfig));
    } catch {}
  }

  const webpackConfigNewSnapshot = stringify(webpackConfig);

  debug(
    'Webpack config with difference:',
    diff(webpackConfigOldSnapshot, webpackConfigNewSnapshot)
  );
  return webpackConfig;
}

export default applyConfig;
