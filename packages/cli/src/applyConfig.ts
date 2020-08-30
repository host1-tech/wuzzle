import type { Configuration } from 'webpack';
import findUp from 'find-up';
import { stringify, diff } from '@wuzzle/helpers';

const debug = require('debug')('@wuzzle/cli:applyConfig');

export interface WuzzleConfig {}

function applyConfig(webpackConfig: Configuration): Configuration {
  debug('Wuzzle process mounted in CWD:', process.cwd());
  const webpackConfigOldSnapshot = stringify(webpackConfig);

  let wuzzleConfig: WuzzleConfig = {};
  try {
    wuzzleConfig = require(findUp.sync('wuzzle.config.js') || '');
  } catch {}
  debug('Wuzzle config to apply:', stringify(wuzzleConfig));

  // TODO use wuzzle config

  const webpackConfigNewSnapshot = stringify(webpackConfig);

  debug('Webpack config changed:', diff(webpackConfigOldSnapshot, webpackConfigNewSnapshot));
  return webpackConfig;
}

export default applyConfig;
