import { resolveRequire } from '@wuzzle/helpers';
import path from 'path';
import { WuzzleModifyOptions } from '../../apply-config';

export default (
  arg0: unknown,
  arg2: unknown,
  { projectPath, commandName, commandArgs }: WuzzleModifyOptions
) => {
  if (commandName !== 'react-scripts') return;

  const reactScriptsSubCommand = commandArgs[0];
  const reactScriptsDir = path.dirname(
    resolveRequire('react-scripts/package.json', { basedir: projectPath })
  );

  if (reactScriptsSubCommand === 'test') {
    return {
      module: {
        rules: [
          {
            test: /\.(js|jsx|ts|tsx)$/,
            exclude: /node_modules/,
            use: [
              {
                loader: resolveRequire('babel-loader', { basedir: reactScriptsDir }),
                options: {
                  presets: [resolveRequire('babel-preset-react-app', { basedir: reactScriptsDir })],
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
                loader: resolveRequire('file-loader', { basedir: reactScriptsDir }),
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
                loader: resolveRequire('file-loader', { basedir: reactScriptsDir }),
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
  }
};
