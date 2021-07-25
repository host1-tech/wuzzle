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
const mockedInternalPreConfigFty = jest.fn();
jest.mock(
  (internalPreConfigPath = '/path/to/internal-pre-config'),
  () => ({ __esModule: true, default: mockedInternalPreConfigFty() }),
  { virtual: true }
);

describe('applyConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env[EK_INTERNAL_PRE_CONFIG];
  });

  it('does nothing with no config found', () => {
    cosmiconfigSync$mockedSearch.mockReturnValueOnce(null);
    expect(applyConfig({})).toEqual({});
  });

  it(`uses side effect of 'modify'`, () => {
    cosmiconfigSync$mockedSearch.mockReturnValueOnce({
      config: {
        modify(webpackConfig: webpack.Configuration) {
          webpackConfig.output = {};
        },
      },
    });
    expect(applyConfig({})).toEqual({ output: {} });
  });

  it(`uses returned value of 'modify'`, () => {
    cosmiconfigSync$mockedSearch.mockReturnValueOnce({
      config: {
        modify(webpackConfig: webpack.Configuration) {
          return { ...webpackConfig, output: {} };
        },
      },
    });
    expect(applyConfig({})).toEqual({ output: {} });
  });

  it(`uses exported function as 'modify'`, () => {
    cosmiconfigSync$mockedSearch.mockReturnValueOnce({
      config(webpackConfig: webpack.Configuration) {
        return { ...webpackConfig, output: {} };
      },
    });
    expect(applyConfig({})).toEqual({ output: {} });
  });

  it('uses side effect of internal pre config', () => {
    cosmiconfigSync$mockedSearch.mockReturnValueOnce(null);
    process.env[EK_INTERNAL_PRE_CONFIG] = internalPreConfigPath;
    mockedInternalPreConfigFty.mockReturnValueOnce((webpackConfig: webpack.Configuration) => {
      webpackConfig.resolve = {};
    });
    expect(applyConfig({})).toEqual({ resolve: {} });
  });

  it('uses returned value of internal pre config', () => {
    cosmiconfigSync$mockedSearch.mockReturnValueOnce(null);
    process.env[EK_INTERNAL_PRE_CONFIG] = internalPreConfigPath;
    mockedInternalPreConfigFty.mockReturnValueOnce((webpackConfig: webpack.Configuration) => {
      return { ...webpackConfig, output: {} };
    });
    expect(applyConfig({})).toEqual({ resolve: {} });
  });

  it('collects debug info and prints', () => {
    const oldWebpackConfig = {};
    const newWebpackConfig = { ...oldWebpackConfig, output: {} };
    cosmiconfigSync$mockedSearch.mockReturnValueOnce({
      config: () => newWebpackConfig,
    });
    applyConfig({ ...oldWebpackConfig });
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
