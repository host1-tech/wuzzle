import type { Configuration } from 'webpack';
import findUp from 'find-up';
import { jsonStringify, diff } from '@wuzzle/helpers';

const debug = require('debug')(`@wuzzle/cli:applyConfig`);

export interface WuzzleConfig {}

function applyConfig(webpackConfig: Configuration): Configuration {
  debug('Wuzzle process mounted in CWD:', process.cwd());
  const webpackConfigOldSnapshot = jsonStringify(webpackConfig);

  let wuzzleConfig: WuzzleConfig = {};
  try {
    wuzzleConfig = require(findUp.sync('wuzzle.config.js') || '');
  } catch {}
  debug('Wuzzle config to apply:', jsonStringify(wuzzleConfig));

  // TODO use wuzzle config

  const webpackConfigNewSnapshot = jsonStringify(webpackConfig);

  debug('Webpack config changed:', diff(webpackConfigOldSnapshot, webpackConfigNewSnapshot));
  return webpackConfig;
}

export default applyConfig;
