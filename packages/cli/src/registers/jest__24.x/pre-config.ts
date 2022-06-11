import { resolveRequire } from '@wuzzle/helpers';

import { WuzzleModifyOptions } from '../../apply-config';

export default (arg0: unknown, arg1: unknown, { commandName }: WuzzleModifyOptions) => {
  if (commandName !== 'jest') return;

  return {
    module: {
      rules: [
        {
          test: /\.[jt]sx?$/,
          use: [{ loader: resolveRequire('babel-loader') }],
        },
      ],
    },
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    },
  };
};
