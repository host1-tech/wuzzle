const { cloneDeep, toPairs } = require('lodash');
const { jsWithBabel: tsjPreset } = require('ts-jest/presets');
const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');
const appPaths = require('react-scripts/config/paths');
const {
  deleteUseItem,
  findUseItems,
  firstRule,
  firstUseItem,
  insertAfterRule,
  insertAfterUseItem,
  insertBeforeRule,
  replaceUseItem,
} = require('../../../../packages/wuzzle/config-tools');

module.exports = {
  modify(webpackConfig, webpack, { commandName }) {
    const lessOptions = { javascriptEnabled: true };
    const staticMediaName = 'static/media/[name].[hash:8].[ext]';

    if (commandName === 'react-scripts') {
      const scriptRule = firstRule(webpackConfig, {
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
      findUseItems(webpackConfig, { loader: 'postcss-loader' }).forEach((useItem) => {
        delete useItem.options.plugins;
      });

      // Support less files in both plain and module formats
      const scssRuleQuery = { file: { dir: appPaths.appSrc, base: 'index.scss' } };
      const lessRule = {
        ...cloneDeep(firstRule(webpackConfig, scssRuleQuery)),
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
      insertAfterRule(webpackConfig, scssRuleQuery, lessRule);

      const scssModuleRuleQuery = { file: { dir: appPaths.appSrc, base: 'index.module.scss' } };
      const lessModuleRule = {
        ...cloneDeep(firstRule(webpackConfig, scssModuleRuleQuery)),
        test: /\.module\.less$/,
      };
      deleteUseItem(lessModuleRule, { loader: 'resolve-url-loader' });
      replaceUseItem(
        lessModuleRule,
        { loader: 'sass-loader' },
        { loader: 'less-loader', options: { sourceMap: true, lessOptions } }
      );
      firstUseItem(lessModuleRule, { loader: 'css-loader' }).options.importLoaders = 2;
      insertAfterRule(webpackConfig, scssModuleRuleQuery, lessModuleRule);

      // Normalize svg loading in react component and url formats
      insertBeforeRule(
        webpackConfig,
        { loader: 'file-loader' },
        {
          test: /\.svg$/,
          use: [
            { loader: '@svgr/webpack' },
            { loader: 'file-loader', options: { name: staticMediaName } },
          ],
        }
      );
    }

    if (commandName === 'transpile' || commandName === 'node') {
      // Setup client-compatible server-side compilation config

      const fileLoadOpts = { name: staticMediaName, emitFile: false };

      const urlLoadOpts = {
        ...fileLoadOpts,
        limit: parseInt(process.env.IMAGE_INLINE_SIZE_LIMIT || '10000'),
      };

      const cssLoadOpts = {
        modules: {
          exportOnlyLocals: true,
          getLocalIdent: getCSSModuleLocalIdent,
        },
      };

      const postcssLoadOpts = {
        ident: 'postcss',
      };

      webpackConfig.output.publicPath = appPaths.publicUrlOrPath;
      webpackConfig.module = {
        rules: [
          { parser: { requireEnsure: false } },
          {
            oneOf: [
              {
                test: /\.(js|jsx|ts|tsx)$/,
                use: [
                  { loader: 'babel-loader' },
                  {
                    loader: 'ts-loader',
                    options: { compilerOptions: { noEmit: false } },
                  },
                ],
              },
              {
                test: /\.css$/,
                use: [
                  {
                    loader: 'css-loader',
                    options: { importLoaders: 1, ...cssLoadOpts },
                  },
                  {
                    loader: 'postcss-loader',
                    options: postcssLoadOpts,
                  },
                ],
              },
              {
                test: /\.(scss|sass)$/,
                use: [
                  {
                    loader: 'css-loader',
                    options: { importLoaders: 3, ...cssLoadOpts },
                  },
                  {
                    loader: 'postcss-loader',
                    options: postcssLoadOpts,
                  },
                  {
                    loader: 'resolve-url-loader',
                    options: { root: appPaths.appSrc },
                  },
                  { loader: 'sass-loader' },
                ],
              },
              {
                test: /\.(less)$/,
                use: [
                  {
                    loader: 'css-loader',
                    options: { importLoaders: 2, ...cssLoadOpts },
                  },
                  {
                    loader: 'postcss-loader',
                    options: postcssLoadOpts,
                  },
                  { loader: 'less-loader', options: { lessOptions } },
                ],
              },
              {
                test: /\.svg$/,
                use: [
                  { loader: '@svgr/webpack' },
                  {
                    loader: 'file-loader',
                    options: fileLoadOpts,
                  },
                ],
              },
              {
                test: /\.(bmp|gif|jpe?g|png|avif)$/,
                loader: 'url-loader',
                options: urlLoadOpts,
              },
              {
                exclude: /\.(json)$/,
                loader: 'file-loader',
                options: fileLoadOpts,
              },
            ],
          },
        ],
      };
      webpackConfig.resolve = { extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'] };
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
