import { resolveRequire } from '@wuzzle/helpers';
import { WuzzleModifyOptions } from '../../apply-config';
import { EK_REACT_SCRIPTS_DISABLE_NEW_JSX_TRANSFORM } from '../../constants';

export default (
  arg0: unknown,
  arg1: unknown,
  { commandName, commandArgs }: WuzzleModifyOptions
) => {
  const reactScriptsCommand = commandArgs[0];

  if (commandName !== 'react-scripts') return;
  if (reactScriptsCommand !== 'test') return;

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
                presets: [
                  [
                    resolveRequire('babel-preset-react-app', { basedir: process.cwd() }),
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
              loader: resolveRequire('file-loader'),
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
