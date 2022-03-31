import { resolveRequire } from '@wuzzle/helpers';
import { cosmiconfigSync } from 'cosmiconfig';
import path from 'path';
import { WuzzleModifyOptions } from '../../apply-config';

const babelConfigExplorer = cosmiconfigSync('babel');

export default (
  arg0: unknown,
  arg1: unknown,
  { projectPath, commandName, commandArgs }: WuzzleModifyOptions
) => {
  if (commandName !== 'razzle') return;

  const razzleSubCommand = commandArgs[0];
  const razzleDir = path.dirname(resolveRequire('razzle/package.json', { basedir: projectPath }));

  if (razzleSubCommand === 'test') {
    return {
      module: {
        rules: [
          {
            test: /\.(js|jsx|mjs|cjs|ts|tsx)$/,
            exclude: /node_modules/,
            use: [
              {
                loader: resolveRequire('babel-loader', { basedir: razzleDir }),
                options: {
                  presets: babelConfigExplorer.search()
                    ? []
                    : [resolveRequire('babel-preset-razzle', { basedir: razzleDir })],
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
                loader: resolveRequire('file-loader', { basedir: razzleDir }),
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
  }
};
