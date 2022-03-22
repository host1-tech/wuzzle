import * as JestTypes from '@jest/types';
import { diff, logError, stringify } from '@wuzzle/helpers';
import { cosmiconfigSync } from 'cosmiconfig';
import debugFty from 'debug';
import { uniqueId } from 'lodash';
import { mocked } from 'ts-jest/utils';
import { InspectOptions } from 'util';
import webpack from 'webpack';
import applyConfig, {
  applyDryRunTweaks,
  applyJest,
  getWuzzleModifyOptions,
  loadWuzzleConfig,
  WuzzleConfig,
  WuzzleModifyOptions,
} from './apply-config';
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

jest.mock('cosmiconfig');
const cosmiconfigSync$mockedSearch = jest.fn();
mocked(cosmiconfigSync).mockReturnValue({ search: cosmiconfigSync$mockedSearch } as never);

const defaultModifyOptions: WuzzleModifyOptions = {
  projectPath: process.cwd(),
  commandName: 'unknown',
  commandArgs: [],
};

const internalPreConfigPath = '@internal-pre-config';
jest.mock(
  '@internal-pre-config',
  () => ({
    __esModule: true,
    default: jest.fn(),
  }),
  { virtual: true }
);
const mockedInternalPreConfig = require(internalPreConfigPath).default as jest.Mock;

jest.mock('@wuzzle/helpers', () => ({
  ...jest.requireActual('@wuzzle/helpers'),
  diff: jest.fn(),
  logError: jest.fn(),
}));

jest.mock('debug', () => {
  const mockedFn = jest.fn();
  return { __esModule: true, default: () => mockedFn };
});
const mockedDebug = mocked(debugFty(DN_APPLY_CONFIG));

describe('applyConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env[EK_CACHE_KEY_OF_ENV_KEYS];
    delete process.env[EK_CACHE_KEY_OF_FILE_PATHS];
  });

  it('does nothing if no config found', () => {
    cosmiconfigSync$mockedSearch.mockReturnValueOnce(null);
    expect(applyConfig({}, webpack)).toEqual({});
  });

  it(`uses side effect of 'modify' field`, () => {
    const wuzzleConfig: WuzzleConfig = {
      modify: jest.fn((webpackConfig: webpack.Configuration) => {
        webpackConfig.output = {};
      }),
    };
    cosmiconfigSync$mockedSearch.mockReturnValueOnce({ config: wuzzleConfig });
    const webpackConfig: webpack.Configuration = {};
    expect(applyConfig(webpackConfig, webpack)).toEqual({ output: {} });
    expect(webpackConfig).toEqual({ output: {} });
    expect(wuzzleConfig.modify).toBeCalledWith(webpackConfig, webpack, defaultModifyOptions);
  });

  it(`uses returned value of 'modify' field`, () => {
    const wuzzleConfig: WuzzleConfig = {
      modify: jest.fn((webpackConfig: webpack.Configuration) => {
        return { ...webpackConfig, output: {} };
      }),
    };
    cosmiconfigSync$mockedSearch.mockReturnValueOnce({ config: wuzzleConfig });
    const webpackConfig: webpack.Configuration = {};
    expect(applyConfig(webpackConfig, webpack)).toEqual({ output: {} });
    expect(webpackConfig).toEqual({ output: {} });
    expect(wuzzleConfig.modify).toBeCalledWith(webpackConfig, webpack, defaultModifyOptions);
  });

  it(`reports error thrown from 'modify'`, () => {
    const error = new Error('message');
    const wuzzleConfig: WuzzleConfig = {
      modify() {
        throw error;
      },
    };
    cosmiconfigSync$mockedSearch.mockReturnValueOnce({ config: wuzzleConfig });
    applyConfig({}, webpack);
    expect(logError).toBeCalledWith(error);
  });

  it('uses side effect of internal pre config', () => {
    cosmiconfigSync$mockedSearch.mockReturnValueOnce(null);
    process.env[EK_INTERNAL_PRE_CONFIG] = internalPreConfigPath;
    mockedInternalPreConfig.mockImplementationOnce((webpackConfig: webpack.Configuration) => {
      webpackConfig.resolve = {};
    });
    const webpackConfig: webpack.Configuration = {};
    expect(applyConfig(webpackConfig, webpack)).toEqual({ resolve: {} });
    expect(webpackConfig).toEqual({ resolve: {} });
    expect(mockedInternalPreConfig).toBeCalledWith(webpackConfig, webpack, defaultModifyOptions);
  });

  it('uses returned value of internal pre config', () => {
    cosmiconfigSync$mockedSearch.mockReturnValueOnce(null);
    process.env[EK_INTERNAL_PRE_CONFIG] = internalPreConfigPath;
    mockedInternalPreConfig.mockImplementationOnce((webpackConfig: webpack.Configuration) => {
      return { ...webpackConfig, resolve: {} };
    });
    const webpackConfig: webpack.Configuration = {};
    expect(applyConfig(webpackConfig, webpack)).toEqual({ resolve: {} });
    expect(webpackConfig).toEqual({ resolve: {} });
    expect(mockedInternalPreConfig).toBeCalledWith(webpackConfig, webpack, defaultModifyOptions);
  });

  it('passes on cache key fields as wuzzle envs', () => {
    const wuzzleConfig: WuzzleConfig = {
      cacheKeyOfEnvKeys: ['*_ENV'],
      cacheKeyOfFilePaths: ['*rc'],
    };
    cosmiconfigSync$mockedSearch.mockReturnValueOnce({ config: wuzzleConfig });
    applyConfig({}, webpack);
    expect(process.env[EK_CACHE_KEY_OF_ENV_KEYS]).toBe(
      JSON.stringify(wuzzleConfig.cacheKeyOfEnvKeys)
    );
    expect(process.env[EK_CACHE_KEY_OF_FILE_PATHS]).toBe(
      JSON.stringify(wuzzleConfig.cacheKeyOfFilePaths)
    );
  });

  it('collects and prints debug info', () => {
    const stringifyOpts: InspectOptions = {};
    applyDryRunTweaks(stringifyOpts);
    const oldWebpackConfig = {};
    const newWebpackConfig = { ...oldWebpackConfig, output: {} };
    cosmiconfigSync$mockedSearch.mockReturnValueOnce({
      config: () => newWebpackConfig,
    });
    applyConfig({ ...oldWebpackConfig }, webpack);
    expect(diff).toBeCalledWith(
      stringify(oldWebpackConfig, stringifyOpts),
      stringify(newWebpackConfig, stringifyOpts)
    );
    [
      'Wuzzle process mounted in CWD:',
      'Wuzzle config to apply:',
      'Webpack config with difference:',
    ].forEach((log, i) => {
      expect(mockedDebug.mock.calls[i][0]).toBe(log);
    });
  });
});

const jestInfo = {};

describe('applyJest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does nothing if no config found', () => {
    cosmiconfigSync$mockedSearch.mockReturnValueOnce(null);
    expect(applyJest({} as JestTypes.Config.ProjectConfig, {})).toEqual({});
  });

  it(`uses side effect of 'jest' field`, () => {
    const wuzzleConfig: WuzzleConfig = {
      jest: jest.fn(jestConfig => {
        jestConfig.transform = [];
      }),
    };
    cosmiconfigSync$mockedSearch.mockReturnValueOnce({ config: wuzzleConfig });
    const jestConfig = {};
    expect(applyJest(jestConfig as JestTypes.Config.ProjectConfig, jestInfo)).toEqual({
      transform: [],
    });
    expect(jestConfig).toEqual({ transform: [] });
    expect(wuzzleConfig.jest).toBeCalledWith(jestConfig, jestInfo, defaultModifyOptions);
  });

  it(`uses returned value of 'jest' field`, () => {
    const wuzzleConfig: WuzzleConfig = {
      jest: jest.fn(jestConfig => {
        return { ...jestConfig, transform: [] };
      }),
    };
    cosmiconfigSync$mockedSearch.mockReturnValueOnce({ config: wuzzleConfig });
    const jestConfig = {};
    expect(applyJest(jestConfig as JestTypes.Config.ProjectConfig, jestInfo)).toEqual({
      transform: [],
    });
    expect(jestConfig).toEqual({ transform: [] });
    expect(wuzzleConfig.jest).toBeCalledWith(jestConfig, jestInfo, defaultModifyOptions);
  });

  it(`reports error thrown from 'jest'`, () => {
    const error = new Error('message');
    const wuzzleConfig: WuzzleConfig = {
      jest() {
        throw error;
      },
    };
    cosmiconfigSync$mockedSearch.mockReturnValueOnce({ config: wuzzleConfig });
    applyJest({} as JestTypes.Config.ProjectConfig, jestInfo);
    expect(logError).toBeCalledWith(error);
  });

  it('collects and prints debug info', () => {
    const stringifyOpts: InspectOptions = {};
    applyDryRunTweaks(stringifyOpts);
    const oldJestConfig = {};
    const newJestConfig = { transform: [] };
    cosmiconfigSync$mockedSearch.mockReturnValueOnce({
      config: { jest: () => newJestConfig },
    });
    applyJest({ ...oldJestConfig } as JestTypes.Config.ProjectConfig, {});
    expect(diff).toBeCalledWith(
      stringify(oldJestConfig, stringifyOpts),
      stringify(newJestConfig, stringifyOpts)
    );
    [
      'Wuzzle process mounted in CWD:',
      'Wuzzle config to apply:',
      'Jest config with difference:',
    ].forEach((log, i) => {
      expect(mockedDebug.mock.calls[i][0]).toBe(log);
    });
  });
});

const originalStdoutIsTTY = process.stdout.isTTY;
const originalStderrIsTTY = process.stderr.isTTY;

describe('applyDryRunTweaks', () => {
  beforeEach(() => {
    process.stdout.isTTY = !process.stderr.isTTY;
  });

  afterEach(() => {
    process.stdout.isTTY = originalStdoutIsTTY;
    process.stderr.isTTY = originalStderrIsTTY;
    delete process.env[EK_DRY_RUN];
  });

  it('reads tty info from stderr and logs to it by default', () => {
    const stringifyOpts: InspectOptions = {};
    applyDryRunTweaks(stringifyOpts);
    expect(stringifyOpts.colors).toBe(process.stderr.isTTY);
    expect(mockedDebug.log).toBe(stderrDebugLog);
  });

  it('reads tty info from stdout and logs to it in dry-run mode', () => {
    process.env[EK_DRY_RUN] = 'true';
    const stringifyOpts: InspectOptions = {};
    applyDryRunTweaks(stringifyOpts);
    expect(stringifyOpts.colors).toBe(process.stdout.isTTY);
    expect(mockedDebug.log).toBe(stdoutDebugLog);
  });
});

describe('getWuzzleModifyOptions', () => {
  afterEach(() => {
    delete process.env[EK_PROJECT_PATH];
    delete process.env[EK_COMMAND_NAME];
    delete process.env[EK_COMMAND_ARGS];
  });

  it('parses values from envs', () => {
    const projectPath = 'projectPath';
    const commandName = 'commandName';
    const commandArgs = [uniqueId()];
    process.env[EK_PROJECT_PATH] = projectPath;
    process.env[EK_COMMAND_NAME] = commandName;
    process.env[EK_COMMAND_ARGS] = JSON.stringify(commandArgs);
    expect(getWuzzleModifyOptions()).toEqual({ projectPath, commandName, commandArgs });
  });

  it('returns default values if no envs given', () => {
    expect(getWuzzleModifyOptions()).toEqual(defaultModifyOptions);
  });
});

describe('loadWuzzleConfig', () => {
  it('returns empty object if no config found', () => {
    cosmiconfigSync$mockedSearch.mockReturnValueOnce(null);
    const { optionsToUse, configLoaded } = loadWuzzleConfig();
    expect(configLoaded).toEqual({});
    expect(optionsToUse).toEqual({});
  });

  it('sets by each field if config exports object', () => {
    const wuzzleConfig: WuzzleConfig = { modify: () => {} };
    cosmiconfigSync$mockedSearch.mockReturnValueOnce({ config: wuzzleConfig });
    const { optionsToUse, configLoaded } = loadWuzzleConfig();
    expect(configLoaded).toBe(wuzzleConfig);
    expect(optionsToUse).toEqual(wuzzleConfig);
  });

  it(`sets as 'modify' field if config exports top-level funciton`, () => {
    const wuzzleConfig: WuzzleConfig = () => {};
    cosmiconfigSync$mockedSearch.mockReturnValueOnce({ config: wuzzleConfig });
    const { optionsToUse, configLoaded } = loadWuzzleConfig();
    expect(configLoaded).toBe(wuzzleConfig);
    expect(optionsToUse.modify).toBe(wuzzleConfig);
  });
});
