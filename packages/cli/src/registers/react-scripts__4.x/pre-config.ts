import { resolveRequire } from '@wuzzle/helpers';
import path from 'path';
import { WuzzleModifyOptions } from '../../apply-config';
import { EK_REACT_SCRIPTS_DISABLE_NEW_JSX_TRANSFORM } from '../../constants';

export default (
  arg0: unknown,
  arg1: unknown,
  { commandName, commandArgs }: WuzzleModifyOptions
) => {
  if (commandName !== 'react-scripts') return;

  const reactScriptsSubCommand = commandArgs[0];
  const reactScriptsDir = path.dirname(
    resolveRequire('react-scripts/package.json', { basedir: process.cwd() })
  );

  if (reactScriptsSubCommand === 'test') {
    return {
      module: {
        rules: [
          {
            test: /\.(js|jsx|mjs|cjs|ts|tsx)$/,
            exclude: /node_modules/,
            use: [
              {
                loader: resolveRequire('babel-loader', { basedir: reactScriptsDir }),
                options: {
                  presets: [
                    [
                      resolveRequire('babel-preset-react-app', { basedir: reactScriptsDir }),
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
            exclude: [/\.(js|jsx|mjs|cjs|ts|tsx|json|css|svg)$/, /node_modules/],
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
        extensions: ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.json'],
      },
    };
  }
};

function hasNewJsxRuntime() {
  if (process.env[EK_REACT_SCRIPTS_DISABLE_NEW_JSX_TRANSFORM] === 'true') {
    return false;
  }

  try {
    resolveRequire('react/jsx-runtime', { basedir: process.cwd() });
    return true;
  } catch {
    return false;
  }
}
