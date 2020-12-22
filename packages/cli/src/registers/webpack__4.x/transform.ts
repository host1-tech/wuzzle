import generate from '@babel/generator';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

export const match = /node_modules[\\/]webpack[\\/]lib[\\/]webpack\.js$/;

export function transform(code: string): string {
  const ast = parse(code);

  let targetId: t.Identifier;
  traverse(ast, {
    StringLiteral(path) {
      if (
        path.node.value == './WebpackOptionsDefaulter' &&
        t.isCallExpression(path.parent) &&
        t.isVariableDeclarator(path.parentPath.parent) &&
        t.isIdentifier(path.parentPath.parent.id)
      ) {
        targetId = path.parentPath.parent.id;
      }
    },

    Identifier(path) {
      if (
        path.node.name == 'options' &&
        t.isCallExpression(path.parent) &&
        t.isMemberExpression(path.parent.callee) &&
        t.isNewExpression(path.parent.callee.object) &&
        t.isIdentifier(path.parent.callee.object.callee) &&
        path.parent.callee.object.callee.name == targetId.name &&
        t.isIdentifier(path.parent.callee.property) &&
        path.parent.callee.property.name == 'process'
      ) {
        path.replaceWithSourceString(
          `require('${require.resolve('../../applyConfig').replace(/\\/g, '\\\\')}').default(${
            path.node.name
          })`
        );
      }
    },
  });

  return generate(ast).code;
}
