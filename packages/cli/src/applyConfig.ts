import { diff, stringify } from '@wuzzle/helpers';
import findUp from 'find-up';
import type webpack from 'webpack';

const debug = require('debug')('@wuzzle/cli:applyConfig');

const WUZZLE_CONFIG_JS = 'wuzzle.config.js';

export interface WuzzleConfig {
  modify?(webpackConfig: webpack.Configuration): webpack.Configuration | undefined;
}

function applyConfig(webpackConfig: webpack.Configuration): webpack.Configuration {
  debug('Wuzzle process mounted in CWD:', process.cwd());
  const webpackConfigOldSnapshot = stringify(webpackConfig);

  let wuzzleConfig: WuzzleConfig = {};
  try {
    const wuzzleConfigPath = require.resolve(findUp.sync(WUZZLE_CONFIG_JS)!);
    delete require.cache[wuzzleConfigPath];
    wuzzleConfig = require(wuzzleConfigPath);
  } catch {}
  debug('Wuzzle config to apply:', stringify(wuzzleConfig));

  if (wuzzleConfig.modify) {
    try {
      const newWebpackConfig = wuzzleConfig.modify(webpackConfig);
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
