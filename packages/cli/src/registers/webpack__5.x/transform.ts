import generate from '@babel/generator';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

export const match = /node_modules[\\/]webpack[\\/]lib[\\/]webpack\.js$/;

export function transform(code: string): string {
  const ast = parse(code);

  traverse(ast, {
    Identifier(path) {
      if (
        path.node.name == 'rawOptions' &&
        t.isCallExpression(path.parent) &&
        t.isIdentifier(path.parent.callee) &&
        path.parent.callee.name == 'getNormalizedWebpackOptions'
      ) {
        const parentPath = path.findParent(p => p.isArrowFunctionExpression());
        if (
          t.isArrowFunctionExpression(parentPath) &&
          t.isVariableDeclarator(parentPath.parent) &&
          t.isIdentifier(parentPath.parent.id) &&
          parentPath.parent.id.name == 'createCompiler'
        ) {
          path.replaceWithSourceString(
            `require('${require.resolve('../../applyConfig').replace(/\\/g, '\\\\')}').default(${
              path.node.name
            })`
          );
        }
      }
    },
  });

  return generate(ast).code;
}
