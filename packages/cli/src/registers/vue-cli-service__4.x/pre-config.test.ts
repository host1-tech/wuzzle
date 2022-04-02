import { resolveRequire } from '@wuzzle/helpers';
import { cloneDeep, forEach, noop, times } from 'lodash';
import { mocked } from 'ts-jest/utils';
import webpackType from 'webpack';
import { getWuzzleModifyOptions, WuzzleModifyOptions } from '../../apply-config';
import preConfig from './pre-config';

const wuzzleModifyOptions: WuzzleModifyOptions = {
  ...getWuzzleModifyOptions(),
  commandName: 'vue-cli-service',
  commandArgs: ['test:unit'],
  commandType: 'jest',
};

jest.mock('@wuzzle/helpers');
mocked(resolveRequire).mockImplementation(id => id);

let vueCliServiceWebpackConfig: webpackType.Configuration = {};
['@vue/cli-service/webpack.config.js', '@vue\\cli-service\\webpack.config.js'].forEach(p => {
  jest.mock(p, () => vueCliServiceWebpackConfig, { virtual: true });
});

class CaseSensitivePathsWebpackPlugin implements webpackType.Plugin {
  apply() {}
}
class FriendlyErrorsWebpackPlugin implements webpackType.Plugin {
  apply() {}
}
forEach(
  {
    '@soda/friendly-errors-webpack-plugin': FriendlyErrorsWebpackPlugin,
    'html-webpack-plugin': class {},
    '@vue/preload-webpack-plugin': class {},
    'copy-webpack-plugin': class {},
  },
  (v, k) => jest.mock(k, () => v, { virtual: true })
);

describe('preConfig.ts', () => {
  it('modifies none on unknown command info', () => {
    const webpackConfig: webpackType.Configuration = {};
    const webpackConfigSnapshot = cloneDeep(webpackConfig);
    expect(
      preConfig(webpackConfig, 0, { ...wuzzleModifyOptions, commandName: 'unknown' })
    ).toBeUndefined();
    expect(webpackConfig).toEqual(webpackConfigSnapshot);

    expect(
      preConfig(webpackConfig, 0, { ...wuzzleModifyOptions, commandArgs: ['unknown'] })
    ).toBeUndefined();
    expect(webpackConfig).toEqual(webpackConfigSnapshot);

    expect(
      preConfig(webpackConfig, 0, { ...wuzzleModifyOptions, commandType: 'unknown' })
    ).toBeUndefined();
    expect(webpackConfig).toEqual(webpackConfigSnapshot);
  });

  it('modifies fields on test:unit/jest given regardless of calling counts', () => {
    vueCliServiceWebpackConfig = {
      context: 'context',
      module: {
        rules: [
          {
            use: [
              { loader: 'cache-loader' },
              {
                loader: 'vue-loader',
                options: { cacheDirectory: 'cacheDirectory', cacheIdentifier: 'cacheIdentifier' },
              },
            ],
          },
        ],
      },
      plugins: [new CaseSensitivePathsWebpackPlugin(), new FriendlyErrorsWebpackPlugin()],
      resolve: {},
      resolveLoader: {},
    };
    jest.resetModules();

    const expectedWebpackConfig: webpackType.Configuration = {
      context: 'context',
      module: {
        rules: [
          {
            use: [
              {
                loader: 'vue-loader',
                options: { optimizeSSR: false, isServerBuild: false },
              },
            ],
          },
        ],
      },
      plugins: [expect.any(CaseSensitivePathsWebpackPlugin)],
      externals: [expect.any(Function)],
      resolve: {},
      resolveLoader: {},
    };
    times(2, () => {
      const webpackConfig: webpackType.Configuration = { externals: [noop] };
      preConfig(webpackConfig, 0, wuzzleModifyOptions);
      expect(webpackConfig).toEqual(expectedWebpackConfig);
    });
  });

  it('fails on test:unit/jest given if required fields absent', () => {
    vueCliServiceWebpackConfig = { module: { rules: [{ use: [] }] } };
    jest.resetModules();
    expect(() => {
      preConfig({}, 0, wuzzleModifyOptions);
    }).toThrow(/vue-loader/);

    vueCliServiceWebpackConfig = { module: { rules: [{ use: ['vue-loader'] }] } };
    jest.resetModules();
    expect(() => {
      preConfig({}, 0, wuzzleModifyOptions);
    }).toThrow(/vue-loader/);

    vueCliServiceWebpackConfig = { module: { rules: [{ use: [{ loader: 'vue-loader' }] }] } };
    jest.resetModules();

    expect(() => {
      preConfig({}, 0, wuzzleModifyOptions);
    }).toThrow(/builtin external/);

    expect(() => {
      preConfig({ externals: [] }, 0, wuzzleModifyOptions);
    }).toThrow(/builtin external/);
  });

  it('extends builtin external to fit vue loading on test:unit/jest given', () => {
    vueCliServiceWebpackConfig = {
      module: { rules: [{ test: /\.vue$/, use: [{ loader: 'vue-loader' }] }] },
    };
    jest.resetModules();

    const mockedBuiltinExternal = jest.fn();
    const webpackConfig: webpackType.Configuration = { externals: [mockedBuiltinExternal] };

    preConfig(webpackConfig, 0, wuzzleModifyOptions);
    const [extendedExternal] = webpackConfig.externals as webpackType.ExternalsFunctionElement[];
    const mockedExternalCb = jest.fn();

    extendedExternal(0, './a.tsx', mockedExternalCb);
    expect(mockedBuiltinExternal).toBeCalledWith(0, './a.tsx', mockedExternalCb);
    jest.clearAllMocks();

    extendedExternal(0, './b.vue', mockedExternalCb);
    expect(mockedBuiltinExternal).toBeCalledWith(0, './b.vue', mockedExternalCb);
    jest.clearAllMocks();

    extendedExternal(0, './c.vue?type=template', mockedExternalCb);
    expect(mockedExternalCb).toBeCalledWith();
    expect(mockedBuiltinExternal).not.toBeCalled();
  });
});
