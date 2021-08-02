import { resolveRequire } from '@wuzzle/helpers';
import { cosmiconfigSync } from 'cosmiconfig';
import path from 'path';
import { EK_COMMAND_ARGS, EK_COMMAND_NAME } from '../../constants';

const babelConfigExplorer = cosmiconfigSync('babel');

export default () => {
  const commandName = process.env[EK_COMMAND_NAME]!;
  const razzleCommand = JSON.parse(process.env[EK_COMMAND_ARGS]!)[0];

  if (commandName !== 'razzle') return;
  if (razzleCommand !== 'test') return;

  return {
    module: {
      rules: [
        {
          test: /\.(js|jsx|mjs|cjs|ts|tsx)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: resolveRequire('babel-loader'),
              options: {
                presets: babelConfigExplorer.search()
                  ? []
                  : [resolveRequire(path.resolve('node_modules/razzle/babel'))],
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
          exclude: [/\.(js|jsx|mjs|cjs|ts|tsx|json|css)$/, /node_modules/],
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
      extensions: ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.json'],
    },
  };
};
