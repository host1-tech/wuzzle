const { cloneDeep, toPairs } = require('lodash');
const { jsWithBabel: tsjPreset } = require('ts-jest/presets');
const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');
const appPaths = require('react-scripts/config/paths');
const webpackConfigFactory = require('react-scripts/config/webpack.config');
const {
  deleteUseItem,
  findUseItems,
  firstRule,
  firstUseItem,
  insertAfterRule,
  insertAfterUseItem,
  insertBeforeRule,
  replaceUseItem,
  findRules,
} = require('../../../../packages/wuzzle/config-tools');

module.exports = {
  modify(webpackConfig, webpack, { commandName }) {
    const reactScriptsWebpackConfig =
      commandName === 'react-scripts' ? webpackConfig : webpackConfigFactory(process.env.NODE_ENV);

    const scriptRule = firstRule(reactScriptsWebpackConfig, {
      file: { dir: appPaths.appSrc, base: 'index.ts' },
    });
    // Tweak babel-loader to use external babel config
    scriptRule.options = { ...scriptRule.options, babelrc: true, presets: [], plugins: [] };
    // Prepend ts-loader to babel-loader to do finer control on TypeScript
    insertAfterUseItem(
      scriptRule,
      { loader: 'babel-loader' },
      {
        loader: 'ts-loader',
        options: { compilerOptions: { noEmit: false, transpileOnly: true } },
      }
    );

    // Tweak postcss-loader to use external postcss config
    findUseItems(reactScriptsWebpackConfig, { loader: 'postcss-loader' }).forEach((useItem) => {
      delete useItem.options.plugins;
    });

    // Support less files in both global and scoped formats
    const lessOptions = { javascriptEnabled: true };

    const scssRuleQuery = { file: { dir: appPaths.appSrc, base: 'index.scss' } };
    const lessRule = {
      ...cloneDeep(firstRule(reactScriptsWebpackConfig, scssRuleQuery)),
      test: /\.(less)$/,
      exclude: /\.module\.less$/,
    };
    deleteUseItem(lessRule, { loader: 'resolve-url-loader' });
    replaceUseItem(
      lessRule,
      { loader: 'sass-loader' },
      { loader: 'less-loader', options: { sourceMap: true, lessOptions } }
    );
    firstUseItem(lessRule, { loader: 'css-loader' }).options.importLoaders = 2;
    insertAfterRule(reactScriptsWebpackConfig, scssRuleQuery, lessRule);

    const scssModuleRuleQuery = { file: { dir: appPaths.appSrc, base: 'index.module.scss' } };
    const lessModuleRule = {
      ...cloneDeep(firstRule(reactScriptsWebpackConfig, scssModuleRuleQuery)),
      test: /\.module\.less$/,
    };
    deleteUseItem(lessModuleRule, { loader: 'resolve-url-loader' });
    replaceUseItem(
      lessModuleRule,
      { loader: 'sass-loader' },
      { loader: 'less-loader', options: { sourceMap: true, lessOptions } }
    );
    firstUseItem(lessModuleRule, { loader: 'css-loader' }).options.importLoaders = 2;
    insertAfterRule(reactScriptsWebpackConfig, scssModuleRuleQuery, lessModuleRule);

    // Normalize svg loading in react component and url formats
    const fileRule = firstRule(reactScriptsWebpackConfig, { loader: 'file-loader' });
    insertBeforeRule(
      reactScriptsWebpackConfig,
      { loader: 'file-loader' },
      {
        test: /\.svg$/,
        use: [{ loader: '@svgr/webpack' }, { loader: 'file-loader', options: fileRule.options }],
      }
    );

    if (commandName === 'transpile' || commandName === 'node') {
      // Setup client-compatible server-side compilation config

      const { module, resolve, resolveLoader } = reactScriptsWebpackConfig;

      while (deleteUseItem(module, { loader: 'mini-css-extract-plugin' }));
      while (deleteUseItem(module, { loader: 'style-loader' }));

      ['file-loader', 'url-loader'].forEach((loader) =>
        [...findRules(module, { loader }), ...findUseItems(module, { loader })].forEach(
          ({ options }) => {
            if (options) options.emitFile = false;
          }
        )
      );

      findUseItems(module, { loader: 'css-loader' }).forEach(({ options: { modules } }) => {
        if (modules) modules.exportOnlyLocals = true;
      });

      webpackConfig.output.publicPath = appPaths.publicUrlOrPath;
      Object.assign(webpackConfig, { module, resolve, resolveLoader });
    }
  },

  jest(jestConfig) {
    // Enhance babel-jest with ts-jest
    const scriptTransformIndex = jestConfig.transform.findIndex(([r]) =>
      new RegExp(r).test('index.ts')
    );
    jestConfig.transform.splice(
      scriptTransformIndex,
      1,
      ...toPairs(tsjPreset.transform).map((p) => [...p, {}])
    );
  },
};
