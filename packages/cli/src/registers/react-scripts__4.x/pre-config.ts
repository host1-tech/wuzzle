import path from 'path';
import type webpack from 'webpack';
import { merge } from 'webpack-merge';
import {
  EK_COMMAND_ARGS,
  EK_COMMAND_NAME,
  EK_REACT_SCRIPTS_DISABLE_NEW_JSX_TRANSFORM,
} from '../../constants';

const commandName = process.env[EK_COMMAND_NAME]!;
const reactScriptsCommand = JSON.parse(process.env[EK_COMMAND_ARGS]!)[0];

export default (webpackConfig: webpack.Configuration) => {
  if (commandName != 'react-scripts') return;
  if (reactScriptsCommand == 'test') {
    return merge(webpackConfig, {
      module: {
        rules: [
          {
            test: /\.(js|jsx|mjs|cjs|ts|tsx)$/,
            exclude: /node_modules/,
            use: [
              {
                loader: require.resolve('babel-loader'),
                options: {
                  presets: [
                    [
                      require.resolve(path.resolve('node_modules/babel-preset-react-app')),
                      {
                        runtime: hasNewJsxRuntime() ? 'automatic' : 'classic',
                      },
                    ],
                  ],
                },
              },
            ],
          },
          {
            test: /\.css$/,
            exclude: /node_modules/,
            use: [
              {
                loader: require.resolve('null-loader'),
              },
            ],
          },
          {
            test: /\.svg$/,
            exclude: /node_modules/,
            use: [
              {
                loader: require.resolve('@svgr/webpack'),
              },
              {
                loader: require.resolve('file-loader'),
                options: {
                  emitFile: false,
                },
              },
            ],
          },
          {
            exclude: [/\.(js|jsx|mjs|cjs|json|ts|tsx|css|svg)$/, /node_modules/],
            use: [
              {
                loader: require.resolve('file-loader'),
                options: {
                  emitFile: false,
                },
              },
            ],
          },
        ],
      },
      resolve: {
        extensions: ['.js', '.jsx', '.mjs', '.cjs', '.json', '.ts', '.tsx'],
      },
    });
  }
};

function hasNewJsxRuntime() {
  if (process.env[EK_REACT_SCRIPTS_DISABLE_NEW_JSX_TRANSFORM] == 'true') {
    return false;
  }

  try {
    require.resolve(path.resolve('node_modules/react/jsx-runtime'));
    return true;
  } catch {
    return false;
  }
}
