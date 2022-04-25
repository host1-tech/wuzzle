import * as JestTypes from '@jest/types';
import { diff, logError, logPlain, stringify } from '@wuzzle/helpers';
import { cosmiconfigSync } from 'cosmiconfig';
import debugFty from 'debug';
import { mocked } from 'ts-jest/utils';
import { InspectOptions } from 'util';
import webpack from 'webpack';
import applyConfig, {
  applyDryRunTweaks,
  applyJest,
  getWuzzleModifyOptions,
  loadWuzzleConfig,
  WuzzleConfig,
} from './apply-config';
import { DN_APPLY_CONFIG, EK, EXIT_CODE_ERROR } from './constants';
import { envGet, envGetDefault, envSet, stderrDebugLog, stdoutDebugLog } from './utils';

jest.mock('cosmiconfig');
const cosmiconfigSync$mockedSearch = jest.fn();
mocked(cosmiconfigSync).mockReturnValue({ search: cosmiconfigSync$mockedSearch } as never);

const defaultModifyOptions = expect.anything();

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
  logPlain: jest.fn(),
}));

jest.mock('debug', () => {
  const mockedFn = jest.fn();
  return { __esModule: true, default: () => mockedFn };
});
const mockedDebug = mocked(debugFty(DN_APPLY_CONFIG));

jest.mock('./utils', () => ({
  ...jest.requireActual('./utils'),
  envGet: jest.fn(),
  envSet: jest.fn(),
}));
const envGetInternalPreConfig = jest
  .fn(envGet)
  .mockReturnValue(envGetDefault(EK.INTERNAL_PRE_CONFIG));
const envGetDryRun = jest.fn(envGet).mockReturnValue(envGetDefault(EK.DRY_RUN));
mocked(envGet).mockImplementation(ek => {
  if (ek === EK.INTERNAL_PRE_CONFIG) {
    return envGetInternalPreConfig(ek);
  } else if (ek === EK.DRY_RUN) {
    return envGetDryRun(ek);
  }
});

jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});

describe('applyConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it(`reports error and terminates process thrown from 'modify'`, () => {
    const error = new Error('message');
    const wuzzleConfig: WuzzleConfig = {
      modify() {
        throw error;
      },
    };
    cosmiconfigSync$mockedSearch.mockReturnValueOnce({ config: wuzzleConfig });
    try {
      applyConfig({}, webpack);
    } catch {}
    expect(logError).toBeCalledWith(error);
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
  });

  it('uses side effect of internal pre config', () => {
    cosmiconfigSync$mockedSearch.mockReturnValueOnce(null);
    envGetInternalPreConfig.mockReturnValueOnce(internalPreConfigPath);
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
    envGetInternalPreConfig.mockReturnValueOnce(internalPreConfigPath);
    mockedInternalPreConfig.mockImplementationOnce((webpackConfig: webpack.Configuration) => {
      return { ...webpackConfig, resolve: {} };
    });
    const webpackConfig: webpack.Configuration = {};
    expect(applyConfig(webpackConfig, webpack)).toEqual({ resolve: {} });
    expect(webpackConfig).toEqual({ resolve: {} });
    expect(mockedInternalPreConfig).toBeCalledWith(webpackConfig, webpack, defaultModifyOptions);
  });

  it('reports error if internal pre config fails', () => {
    cosmiconfigSync$mockedSearch.mockReturnValueOnce(null);
    envGetInternalPreConfig.mockReturnValueOnce(internalPreConfigPath);
    mockedInternalPreConfig.mockImplementationOnce(() => {
      throw 0;
    });
    applyConfig({}, webpack);
    expect(logPlain).toBeCalledWith(expect.stringContaining('failed'));
  });

  it('passes on cache key fields as wuzzle envs', () => {
    const wuzzleConfig: WuzzleConfig = {
      cacheKeyOfEnvKeys: ['*_ENV'],
      cacheKeyOfFilePaths: ['*rc'],
    };
    cosmiconfigSync$mockedSearch.mockReturnValueOnce({ config: wuzzleConfig });
    applyConfig({}, webpack);
    expect(envSet).toBeCalledWith(EK.CACHE_KEY_OF_ENV_KEYS, wuzzleConfig.cacheKeyOfEnvKeys);
    expect(envSet).toBeCalledWith(EK.CACHE_KEY_OF_FILE_PATHS, wuzzleConfig.cacheKeyOfFilePaths);
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
  });

  it('reads tty info from stderr and logs to it by default', () => {
    const stringifyOpts: InspectOptions = {};
    applyDryRunTweaks(stringifyOpts);
    expect(stringifyOpts.colors).toBe(process.stderr.isTTY);
    expect(mockedDebug.log).toBe(stderrDebugLog);
  });

  it('reads tty info from stdout and logs to it in dry-run mode', () => {
    envGetDryRun.mockReturnValueOnce('true');
    const stringifyOpts: InspectOptions = {};
    applyDryRunTweaks(stringifyOpts);
    expect(stringifyOpts.colors).toBe(process.stdout.isTTY);
    expect(mockedDebug.log).toBe(stdoutDebugLog);
  });
});

describe('getWuzzleModifyOptions', () => {
  it('works', () => {
    expect(getWuzzleModifyOptions()).toBeTruthy();
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
