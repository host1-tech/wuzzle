import { diff, stringify } from '@wuzzle/helpers';
import webpack from 'webpack';
import applyConfig from './apply-config';
import { EK_INTERNAL_PRE_CONFIG } from './constants';

jest.mock('@wuzzle/helpers/lib/diff');

let cosmiconfigSync$mockedSearch: jest.Mock;
jest.mock('cosmiconfig', () => {
  cosmiconfigSync$mockedSearch = jest.fn();
  return {
    cosmiconfigSync: () => ({
      search: cosmiconfigSync$mockedSearch,
    }),
  };
});

let mockedDebug: jest.Mock;
jest.mock('debug', () => {
  mockedDebug = jest.fn();
  return { __esModule: true, default: () => mockedDebug };
});

let internalPreConfigPath: string;
const mockedInternalPreConfig = jest.fn();
jest.mock(
  (internalPreConfigPath = '/path/to/internal-pre-config'),
  () => ({
    __esModule: true,
    default: mockedInternalPreConfig,
  }),
  { virtual: true }
);

describe('applyConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env[EK_INTERNAL_PRE_CONFIG];
  });

  it('does nothing with no config found', () => {
    cosmiconfigSync$mockedSearch.mockReturnValueOnce(null);
    expect(applyConfig({}, webpack)).toEqual({});
  });

  it(`uses side effect of 'modify'`, () => {
    const wuzzleConfig = {
      modify: jest.fn().mockImplementation((webpackConfig: webpack.Configuration) => {
        webpackConfig.output = {};
      }),
    };
    cosmiconfigSync$mockedSearch.mockReturnValueOnce({ config: wuzzleConfig });
    const webpackConfig: webpack.Configuration = {};
    expect(applyConfig(webpackConfig, webpack)).toEqual({ output: {} });
    expect(webpackConfig).toEqual({ output: {} });
    expect(wuzzleConfig.modify.mock.calls[0][1]).toBe(webpack);
  });

  it(`uses returned value of 'modify'`, () => {
    const wuzzleConfig = {
      modify: jest.fn().mockImplementation((webpackConfig: webpack.Configuration) => {
        return { ...webpackConfig, output: {} };
      }),
    };
    cosmiconfigSync$mockedSearch.mockReturnValueOnce({ config: wuzzleConfig });
    const webpackConfig: webpack.Configuration = {};
    expect(applyConfig(webpackConfig, webpack)).toEqual({ output: {} });
    expect(webpackConfig).toEqual({ output: {} });
    expect(wuzzleConfig.modify.mock.calls[0][1]).toBe(webpack);
  });

  it(`uses exported function as 'modify'`, () => {
    const wuzzleConfig = jest.fn().mockImplementation((webpackConfig: webpack.Configuration) => {
      return { ...webpackConfig, output: {} };
    });
    cosmiconfigSync$mockedSearch.mockReturnValueOnce({ config: wuzzleConfig });
    const webpackConfig: webpack.Configuration = {};
    expect(applyConfig(webpackConfig, webpack)).toEqual({ output: {} });
    expect(webpackConfig).toEqual({ output: {} });
    expect(wuzzleConfig.mock.calls[0][1]).toBe(webpack);
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
    expect(mockedInternalPreConfig.mock.calls[0][1]).toBe(webpack);
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
    expect(mockedInternalPreConfig.mock.calls[0][1]).toBe(webpack);
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
      expect(mockedDebug.mock.calls[i][0]).toEqual(expect.stringContaining(log));
    });
  });
});
