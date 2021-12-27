import { resolveRequire } from '@wuzzle/helpers';
import { cosmiconfigSync } from 'cosmiconfig';
import { WuzzleModifyOptions } from '../../apply-config';

const babelConfigExplorer = cosmiconfigSync('babel');

export default (
  arg0: unknown,
  arg1: unknown,
  { commandName, commandArgs }: WuzzleModifyOptions
) => {
  const razzleSubCommand = commandArgs[0];

  if (commandName !== 'razzle') return;
  if (razzleSubCommand !== 'test') return;

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
                  : [resolveRequire('razzle/babel', { basedir: process.cwd() })],
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
