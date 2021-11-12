import { diff, stringify } from '@wuzzle/helpers';
import { cosmiconfigSync } from 'cosmiconfig';
import debugFty from 'debug';
import { uniqueId } from 'lodash';
import { mocked } from 'ts-jest/utils';
import webpack from 'webpack';
import applyConfig, {
  WuzzleConfigModify,
  WuzzleConfigOptions,
  WuzzleModifyOptions,
} from './apply-config';
import {
  EK_CACHE_KEY_OF_ENV_KEYS,
  EK_CACHE_KEY_OF_FILE_PATHS,
  EK_COMMAND_ARGS,
  EK_COMMAND_NAME,
  EK_INTERNAL_PRE_CONFIG,
  EK_PROJECT_PATH,
} from './constants';

const defaultModifyOptions: WuzzleModifyOptions = {
  projectPath: process.cwd(),
  commandName: 'unknown',
  commandArgs: [],
};

jest.mock('@wuzzle/helpers', () => ({ ...jest.requireActual('@wuzzle/helpers'), diff: jest.fn() }));

jest.mock('cosmiconfig');
const cosmiconfigSync$mockedSearch = jest.fn();
mocked(cosmiconfigSync).mockReturnValue({ search: cosmiconfigSync$mockedSearch } as never);

jest.mock('debug', () => {
  const mockedFn = jest.fn();
  return { __esModule: true, default: () => mockedFn };
});
const mockedDebug = mocked(debugFty(''));

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

describe('applyConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env[EK_PROJECT_PATH];
    delete process.env[EK_COMMAND_NAME];
    delete process.env[EK_COMMAND_ARGS];
    delete process.env[EK_INTERNAL_PRE_CONFIG];
    delete process.env[EK_CACHE_KEY_OF_ENV_KEYS];
    delete process.env[EK_CACHE_KEY_OF_FILE_PATHS];
  });

  it('does nothing with no config found', () => {
    cosmiconfigSync$mockedSearch.mockReturnValueOnce(null);
    expect(applyConfig({}, webpack)).toEqual({});
  });

  it(`uses side effect of 'modify'`, () => {
    const wuzzleConfig: WuzzleConfigOptions = {
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

  it(`uses returned value of 'modify'`, () => {
    const wuzzleConfig: WuzzleConfigOptions = {
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

  it(`uses exported function as 'modify'`, () => {
    const wuzzleConfig: WuzzleConfigModify = jest.fn((webpackConfig: webpack.Configuration) => {
      return { ...webpackConfig, output: {} };
    });
    cosmiconfigSync$mockedSearch.mockReturnValueOnce({ config: wuzzleConfig });
    const webpackConfig: webpack.Configuration = {};
    expect(applyConfig(webpackConfig, webpack)).toEqual({ output: {} });
    expect(webpackConfig).toEqual({ output: {} });
    expect(wuzzleConfig).toBeCalledWith(webpackConfig, webpack, defaultModifyOptions);
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

  it('passes wuzzle envs as modify options', () => {
    const wuzzleConfig: WuzzleConfigModify = jest.fn();
    cosmiconfigSync$mockedSearch.mockReturnValueOnce({ config: wuzzleConfig });
    const projectPath = 'projectPath';
    const commandName = 'commandName';
    const commandArgs = [uniqueId()];
    process.env[EK_PROJECT_PATH] = projectPath;
    process.env[EK_COMMAND_NAME] = commandName;
    process.env[EK_COMMAND_ARGS] = JSON.stringify(commandArgs);
    const webpackConfig: webpack.Configuration = {};
    applyConfig(webpackConfig, webpack);
    expect(wuzzleConfig).toBeCalledWith(webpackConfig, webpack, {
      projectPath,
      commandName,
      commandArgs,
    });
  });

  it('passes cache key fields as wuzzle envs', () => {
    const wuzzleConfig: WuzzleConfigOptions = {
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

  it('collects debug info and prints', () => {
    const oldWebpackConfig = {};
    const newWebpackConfig = { ...oldWebpackConfig, output: {} };
    cosmiconfigSync$mockedSearch.mockReturnValueOnce({
      config: () => newWebpackConfig,
    });
    applyConfig({ ...oldWebpackConfig }, webpack);
    expect(diff).toBeCalledWith(stringify(oldWebpackConfig), stringify(newWebpackConfig));
    [
      'Wuzzle process mounted in CWD:',
      'Wuzzle config to apply:',
      'Webpack config with difference:',
    ].forEach((log, i) => {
      expect(mockedDebug.mock.calls[i][0]).toBe(log);
    });
  });
});
