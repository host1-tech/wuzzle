import * as JestTypes from '@jest/types';
import { diff, logError, stringify } from '@wuzzle/helpers';
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
  EK_COMMAND_TYPE,
  EK_DRY_RUN,
  EK_INTERNAL_PRE_CONFIG,
  EK_PROJECT_PATH,
} from './constants';
import { stderrDebugLog, stdoutDebugLog } from './utils';

const debug = debugFty(DN_APPLY_CONFIG);

type WebpackConfig = webpackType.Configuration;
type Webpack = typeof webpackType;

type JestConfig = JestTypes.Config.ProjectConfig;
type JestInfo = {};

export interface WuzzleModifyOptions {
  projectPath: string;
  commandName: string;
  commandArgs: string[];
  commandType: string;
}

export type WuzzleConfigModify = (
  webpackConfig: WebpackConfig,
  webpack: Webpack,
  modifyOptions: WuzzleModifyOptions
) => WebpackConfig | void;

export interface WuzzleConfigOptions {
  modify?: WuzzleConfigModify;
  cacheKeyOfEnvKeys?: string[];
  cacheKeyOfFilePaths?: string[];
  jest?: (
    jestConfig: JestConfig,
    jestInfo: JestInfo,
    modifyOptions: WuzzleModifyOptions
  ) => JestConfig | void;
}

export type WuzzleConfig = WuzzleConfigModify | WuzzleConfigOptions;

export function applyConfig(webpackConfig: WebpackConfig, webpack: Webpack): WebpackConfig {
  const stringifyOpts: InspectOptions = {};
  applyDryRunTweaks(stringifyOpts);

  const wuzzleModifyOptions = getWuzzleModifyOptions();
  debug('Wuzzle process mounted in CWD:', wuzzleModifyOptions.projectPath);

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

  const { optionsToUse, configLoaded } = loadWuzzleConfig();
  debug('Wuzzle config to apply:', stringify(configLoaded, stringifyOpts));

  if (optionsToUse.modify) {
    try {
      const webpackConfigToMerge = optionsToUse.modify(webpackConfig, webpack, wuzzleModifyOptions);
      if (webpackConfigToMerge) {
        Object.assign(webpackConfig, merge(webpackConfig, webpackConfigToMerge));
      }
    } catch (e) {
      logError(e);
    }
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

export function applyJest(jestConfig: JestConfig, jestInfo: JestInfo): JestConfig {
  const stringifyOpts: InspectOptions = {};
  applyDryRunTweaks(stringifyOpts);

  const wuzzleModifyOptions = getWuzzleModifyOptions();
  debug('Wuzzle process mounted in CWD:', wuzzleModifyOptions.projectPath);

  const jestConfigOldSnapshot = stringify(jestConfig, stringifyOpts);

  const { optionsToUse, configLoaded } = loadWuzzleConfig();
  debug('Wuzzle config to apply:', stringify(configLoaded, stringifyOpts));

  if (optionsToUse.jest) {
    try {
      const jestConfigToMerge = optionsToUse.jest(jestConfig, jestInfo, wuzzleModifyOptions);
      if (jestConfigToMerge) {
        Object.assign(jestConfig, merge(jestConfig, jestConfigToMerge));
      }
    } catch (e) {
      logError(e);
    }
  }
  const jestConfigNewSnapshot = stringify(jestConfig, stringifyOpts);

  debug('Jest config with difference:', diff(jestConfigOldSnapshot, jestConfigNewSnapshot));
  return jestConfig;
}

export function applyDryRunTweaks(stringifyOpts: InspectOptions): void {
  if (process.env[EK_DRY_RUN]) {
    stringifyOpts.colors = process.stdout.isTTY;
    debug.log = stdoutDebugLog;
  } else {
    stringifyOpts.colors = process.stderr.isTTY;
    debug.log = stderrDebugLog;
  }
  debug.useColors = stringifyOpts.colors;
}

export function getWuzzleModifyOptions(): WuzzleModifyOptions {
  return {
    projectPath: process.env[EK_PROJECT_PATH] ?? process.cwd(),
    commandName: process.env[EK_COMMAND_NAME] ?? 'unknown',
    commandArgs: JSON.parse(process.env[EK_COMMAND_ARGS] ?? '[]'),
    commandType: process.env[EK_COMMAND_TYPE] ?? 'default',
  };
}

export function loadWuzzleConfig(): {
  optionsToUse: WuzzleConfigOptions;
  configLoaded: WuzzleConfig;
} {
  const wuzzleConfigExplorer = cosmiconfigSync('wuzzle');

  const optionsToUse: WuzzleConfigOptions = {};
  const configLoaded: WuzzleConfig = wuzzleConfigExplorer.search()?.config || {};
  if (typeof configLoaded === 'function') {
    optionsToUse.modify = configLoaded;
  } else {
    Object.assign(optionsToUse, configLoaded);
  }
  return { optionsToUse, configLoaded };
}

export default applyConfig;
