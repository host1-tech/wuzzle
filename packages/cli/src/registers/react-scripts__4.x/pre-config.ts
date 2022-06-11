import path from 'path';

import { resolveRequire } from '@wuzzle/helpers';

import { WuzzleModifyOptions } from '../../apply-config';
import { EK } from '../../constants';
import { envGet } from '../../utils';

export default (
  arg0: unknown,
  arg1: unknown,
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
                        runtime: hasNewJsxRuntime(projectPath) ? 'automatic' : 'classic',
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

function hasNewJsxRuntime(projectPath: string) {
  if (envGet(EK.TP_DISABLE_NEW_JSX_TRANSFORM)) {
    return false;
  }

  try {
    resolveRequire('react/jsx-runtime', { basedir: projectPath });
    return true;
  } catch {
    return false;
  }
}
