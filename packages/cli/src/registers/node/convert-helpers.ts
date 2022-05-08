import { TranspileOptions } from '../../transpile';

export function getConvertOptions(overrides: TranspileOptions = {}): TranspileOptions {
  return {
    webpackConfig: {
      devtool: 'inline-cheap-module-source-map',
    },
    ...overrides,
  };
}
