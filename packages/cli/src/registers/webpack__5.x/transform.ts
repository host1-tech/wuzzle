import generate from '@babel/generator';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { resolveRequire } from '@wuzzle/helpers';
import { addHook } from 'pirates';

export function register() {
  const match = /node_modules[\\/]webpack[\\/]lib[\\/]webpack\.js$/;

  const piratesOptions = {
    exts: ['.js'],
    matcher: (filepath: string) => match.test(filepath),
    ignoreNodeModules: false,
  };

  addHook(transform, piratesOptions);
}

export function transform(code: string): string {
  const ast = parse(code);

  traverse(ast, {
    Identifier(path) {
      if (
        path.node.name === 'rawOptions' &&
        t.isCallExpression(path.parent) &&
        t.isIdentifier(path.parent.callee) &&
        path.parent.callee.name === 'getNormalizedWebpackOptions'
      ) {
        const parentPath = path.findParent(p => p.isArrowFunctionExpression());
        if (
          t.isArrowFunctionExpression(parentPath) &&
          t.isVariableDeclarator(parentPath.parent) &&
          t.isIdentifier(parentPath.parent.id) &&
          parentPath.parent.id.name === 'createCompiler'
        ) {
          path.replaceWithSourceString(
            `require('${resolveRequire('../../apply-config').replace(/\\/g, '\\\\')}').default(${
              path.node.name
            })`
          );
        }
      }
    },
  });

  return generate(ast).code;
}
