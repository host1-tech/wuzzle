import path from 'path';
import type webpack from 'webpack';
import { merge } from 'webpack-merge';
import { resolveRequire } from '@wuzzle/helpers';
import { EK_COMMAND_ARGS, EK_COMMAND_NAME } from '../../constants';

export default (webpackConfig: webpack.Configuration) => {
  const commandName = process.env[EK_COMMAND_NAME]!;
  const reactScriptsCommand = JSON.parse(process.env[EK_COMMAND_ARGS]!)[0];

  if (commandName !== 'react-scripts') return webpackConfig;
  if (reactScriptsCommand !== 'test') return webpackConfig;

  return merge(webpackConfig, {
    module: {
      rules: [
        {
          test: /\.(js|jsx|ts|tsx)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: resolveRequire('babel-loader'),
              options: {
                presets: [resolveRequire(path.resolve('node_modules/babel-preset-react-app'))],
              },
            },
          ],
        },
        {
          test: /\.css$/,
          exclude: /node_modules/,
          use: [
            {
              loader: resolveRequire('null-loader'),
            },
          ],
        },
        {
          test: /\.svg$/,
          exclude: /node_modules/,
          use: [
            {
              loader: resolveRequire('@svgr/webpack'),
            },
            {
              loader: resolveRequire('file-loader'),
              options: {
                emitFile: false,
              },
            },
          ],
        },
        {
          exclude: [/\.(js|jsx|ts|tsx|json|css|svg)$/, /node_modules/],
          use: [
            {
              loader: resolveRequire('file-loader'),
              options: {
                emitFile: false,
              },
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    },
  });
};
