import { resolveRequire } from '@wuzzle/helpers';
import path from 'path';
import { WuzzleModifyOptions } from '../../apply-config';

export default (
  arg0: unknown,
  arg2: unknown,
  { commandName, commandArgs }: WuzzleModifyOptions
) => {
  const reactScriptsCommand = commandArgs[0];

  if (commandName !== 'react-scripts') return;
  if (reactScriptsCommand !== 'test') return;

  return {
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
  };
};
