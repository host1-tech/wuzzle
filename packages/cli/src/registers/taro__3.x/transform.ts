import generate from '@babel/generator';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

export const matches = {
  nimiRunnerIndexJs: /node_modules[\\/]@tarojs[\\/]mini-runner[\\/]dist[\\/]index.js$/,
  webpackRunnerIndexJs: /node_modules[\\/]@tarojs[\\/]webpack-runner[\\/]dist[\\/]index.js$/,
};

export function transform(code: string, file: string): string {
  if (matches.nimiRunnerIndexJs.test(file)) {
    const ast = parse(code);
    code = generate(ast).code;
  } else if (matches.webpackRunnerIndexJs.test(file)) {
    const ast = parse(code);
    code = generate(ast).code;
  }

  return code;
}
