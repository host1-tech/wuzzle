import * as JestTypes from '@jest/types';
import { yellow } from 'chalk';
import { cosmiconfigSync } from 'cosmiconfig';
import debugFty from 'debug';
import { InspectOptions } from 'util';
import type webpackType from 'webpack';

import { diff, logError, logPlain, stringify } from '@wuzzle/helpers';

import { CONFIG_FILENAME, DN_APPLY_CONFIG, EK, EXIT_CODE_ERROR } from './constants';
import { envGet, envSet, stderrDebugLog, stdoutDebugLog, wMerge } from './utils';

const debug = debugFty(DN_APPLY_CONFIG);

type WebpackConfig = webpackType.Configuration;
type Webpack = typeof webpackType;

type JestConfig = JestTypes.Config.ProjectConfig;
type JestInfo = {};

/**
 * The data structure of param `wuzzleContext` in the `wuzzle.config.js`. Notice that,
 * from the view of wuzzle maintainers, the `wuzzleContext` is also called
 * `wuzzleModifyOptions` or just `modifyOptions`.
 */
export interface WuzzleModifyOptions {
  // the absolute root path of the current project
  projectPath: string;
  // the name of the original command
  commandName: string;
  // the arguments of the original command
  commandArgs: string[];
  // the extra information of the original command
  commandType: string;
}

/**
 * The data structure of the exports of the `wuzzle.config.js`.
 */
export type WuzzleConfig = WuzzleConfigModify | WuzzleConfigOptions;

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

export function applyConfig(webpackConfig: WebpackConfig, webpack: Webpack): WebpackConfig {
  const stringifyOpts: InspectOptions = {};
  applyDryRunTweaks(stringifyOpts);

  const wuzzleModifyOptions = getWuzzleModifyOptions();
  debug('Wuzzle process mounted in CWD:', wuzzleModifyOptions.projectPath);

  const internalPreConfigPath = envGet(EK.INTERNAL_PRE_CONFIG);
  if (internalPreConfigPath) {
    try {
      const internalPreConfig: WuzzleConfigModify = require(internalPreConfigPath).default;
      const webpackConfigToMerge = internalPreConfig(webpackConfig, webpack, wuzzleModifyOptions);
      if (webpackConfigToMerge) {
        Object.assign(webpackConfig, wMerge(webpackConfig, webpackConfigToMerge));
      }
    } catch {
      logPlain(yellow(`Internal pre config '${internalPreConfigPath}' failed.`));
    }
  }

  const webpackConfigOldSnapshot = stringify(webpackConfig, stringifyOpts);

  const { optionsToUse, configLoaded } = loadWuzzleConfig();
  debug('Wuzzle config to apply:', stringify(configLoaded, stringifyOpts));

  if (optionsToUse.modify) {
    try {
      const webpackConfigToMerge = optionsToUse.modify(webpackConfig, webpack, wuzzleModifyOptions);
      if (webpackConfigToMerge) {
        Object.assign(webpackConfig, wMerge(webpackConfig, webpackConfigToMerge));
      }
    } catch (e) {
      logError(e);
      process.exit(EXIT_CODE_ERROR);
    }
  }
  if (optionsToUse.cacheKeyOfEnvKeys) {
    envSet(EK.CACHE_KEY_OF_ENV_KEYS, optionsToUse.cacheKeyOfEnvKeys);
  }
  if (optionsToUse.cacheKeyOfFilePaths) {
    envSet(EK.CACHE_KEY_OF_FILE_PATHS, optionsToUse.cacheKeyOfFilePaths);
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
        Object.assign(jestConfig, wMerge(jestConfig, jestConfigToMerge));
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
  if (envGet(EK.DRY_RUN)) {
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
    projectPath: envGet(EK.PROJECT_PATH),
    commandName: envGet(EK.COMMAND_NAME),
    commandArgs: envGet(EK.COMMAND_ARGS),
    commandType: envGet(EK.COMMAND_TYPE),
  };
}

export function loadWuzzleConfig(): {
  optionsToUse: WuzzleConfigOptions;
  configLoaded: WuzzleConfig;
} {
  const wuzzleConfigExplorer = cosmiconfigSync('wuzzle', {
    searchPlaces: [CONFIG_FILENAME],
  });

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
