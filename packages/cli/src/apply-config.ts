import { diff, stringify } from '@wuzzle/helpers';
import { cosmiconfigSync } from 'cosmiconfig';
import debugFty from 'debug';
import { InspectOptions } from 'util';
import type webpackType from 'webpack';
import { merge } from 'webpack-merge';
import {
  DN_APPLY_CONFIG,
  EK_CACHE_KEY_OF_ENV_KEYS,
  EK_CACHE_KEY_OF_FILE_PATHS,
  EK_COMMAND_ARGS,
  EK_COMMAND_NAME,
  EK_DRY_RUN,
  EK_INTERNAL_PRE_CONFIG,
  EK_PROJECT_PATH,
} from './constants';
import { stderrDebugLog, stdoutDebugLog } from './utils';

const debug = debugFty(DN_APPLY_CONFIG);

export interface WuzzleModifyOptions {
  projectPath: string;
  commandName: string;
  commandArgs: string[];
}

export type WuzzleConfigModify = (
  webpackConfig: webpackType.Configuration,
  webpack: typeof webpackType,
  modifyOptions: WuzzleModifyOptions
) => webpackType.Configuration | void;

export interface WuzzleConfigOptions {
  modify?: WuzzleConfigModify;
  cacheKeyOfEnvKeys?: string[];
  cacheKeyOfFilePaths?: string[];
}

export type WuzzleConfig = WuzzleConfigModify | WuzzleConfigOptions;

export function applyConfig(
  webpackConfig: webpackType.Configuration,
  webpack: typeof webpackType
): webpackType.Configuration {
  const stringifyOpts: InspectOptions = {};
  if (process.env[EK_DRY_RUN]) {
    stringifyOpts.colors = process.stdout.isTTY;
    debug.log = stdoutDebugLog;
  } else {
    stringifyOpts.colors = process.stderr.isTTY;
    debug.log = stderrDebugLog;
  }
  debug.useColors = stringifyOpts.colors;

  debug('Wuzzle process mounted in CWD:', process.cwd());
  const wuzzleConfigExplorer = cosmiconfigSync('wuzzle');

  const wuzzleModifyOptions: WuzzleModifyOptions = {
    projectPath: process.env[EK_PROJECT_PATH] ?? process.cwd(),
    commandName: process.env[EK_COMMAND_NAME] ?? 'unknown',
    commandArgs: JSON.parse(process.env[EK_COMMAND_ARGS] ?? '[]'),
  };

  const internalPreConfigPath = process.env[EK_INTERNAL_PRE_CONFIG];
  if (internalPreConfigPath) {
    try {
      const internalPreConfig: WuzzleConfigModify = require(internalPreConfigPath).default;
      const webpackConfigToMerge = internalPreConfig(webpackConfig, webpack, wuzzleModifyOptions);
      if (webpackConfigToMerge) {
        Object.assign(webpackConfig, merge(webpackConfig, webpackConfigToMerge));
      }
    } catch {}
  }

  const webpackConfigOldSnapshot = stringify(webpackConfig, stringifyOpts);

  const optionsToUse: WuzzleConfigOptions = {};

  const configLoaded = wuzzleConfigExplorer.search()?.config || {};
  if (typeof configLoaded === 'function') {
    optionsToUse.modify = configLoaded;
  } else {
    Object.assign(optionsToUse, configLoaded);
  }
  debug('Wuzzle config to apply:', stringify(configLoaded, stringifyOpts));

  if (optionsToUse.modify) {
    try {
      const webpackConfigToMerge = optionsToUse.modify(webpackConfig, webpack, wuzzleModifyOptions);
      if (webpackConfigToMerge) {
        Object.assign(webpackConfig, merge(webpackConfig, webpackConfigToMerge));
      }
    } catch {}
  }
  if (optionsToUse.cacheKeyOfEnvKeys) {
    process.env[EK_CACHE_KEY_OF_ENV_KEYS] = JSON.stringify(optionsToUse.cacheKeyOfEnvKeys);
  }
  if (optionsToUse.cacheKeyOfFilePaths) {
    process.env[EK_CACHE_KEY_OF_FILE_PATHS] = JSON.stringify(optionsToUse.cacheKeyOfFilePaths);
  }

  const webpackConfigNewSnapshot = stringify(webpackConfig, stringifyOpts);

  debug(
    'Webpack config with difference:',
    diff(webpackConfigOldSnapshot, webpackConfigNewSnapshot)
  );
  return webpackConfig;
}

export default applyConfig;
