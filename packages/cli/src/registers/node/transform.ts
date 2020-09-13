import deasync from 'deasync';
import { callbackify } from 'util';
import transpile from '../../transpile';

export function transform(code: string, file: string): string {
  return deasync(callbackify(transpile))({
    inputCode: code,
    inputCodePath: file,
    webpackConfig: {
      mode: 'development',
      target: 'node',
      devtool: 'inline-cheap-module-source-map',
    },
  });
}
