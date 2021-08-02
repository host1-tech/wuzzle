import { diff, stringify } from '@wuzzle/helpers';
import { cosmiconfigSync } from 'cosmiconfig';
import debugFty from 'debug';
import type webpackType from 'webpack';
import { merge } from 'webpack-merge';
import { EK_INTERNAL_PRE_CONFIG } from './constants';

const debug = debugFty('@wuzzle/cli:applyConfig');

export type WuzzleConfigModify = (
  webpackConfig: webpackType.Configuration,
  webpack: typeof webpackType
) => webpackType.Configuration | void;

export interface WuzzleConfigOptions {
  modify?: WuzzleConfigModify;
}

export type WuzzleConfig = WuzzleConfigModify | WuzzleConfigOptions;

function applyConfig(
  webpackConfig: webpackType.Configuration,
  webpack: typeof webpackType
): webpackType.Configuration {
  debug('Wuzzle process mounted in CWD:', process.cwd());
  const wuzzleConfigExplorer = cosmiconfigSync('wuzzle');

  const internalPreConfigPath = process.env[EK_INTERNAL_PRE_CONFIG];
  if (internalPreConfigPath) {
    try {
      const internalPreConfig: WuzzleConfigModify = require(internalPreConfigPath).default;
      const webpackConfigToMerge = internalPreConfig(webpackConfig, webpack);
      if (webpackConfigToMerge) {
        Object.assign(webpackConfig, merge(webpackConfig, webpackConfigToMerge));
      }
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
      const webpackConfigToMerge = optionsToUse.modify(webpackConfig, webpack);
      if (webpackConfigToMerge) {
        Object.assign(webpackConfig, merge(webpackConfig, webpackConfigToMerge));
      }
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
