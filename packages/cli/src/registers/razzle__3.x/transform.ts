import generate from '@babel/generator';
import { parse } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

export const match = /node_modules[\\/]razzle[\\/]bin[\\/]razzle\.js$/;

export function transform(code: string): string {
  const ast = parse(code);

  traverse(ast, {
    CallExpression(path) {
      if (
        t.isArrayExpression(path.parent) &&
        t.isMemberExpression(path.node.callee) &&
        t.isIdentifier(path.node.callee.object) &&
        path.node.callee.object.name == 'require' &&
        t.isIdentifier(path.node.callee.property) &&
        path.node.callee.property.name == 'resolve' &&
        findParentSpawnSync(path)
      ) {
        path.parent.elements.unshift(
          t.stringLiteral('-r'),
          t.stringLiteral(
            process.argv[2] == 'test'
              ? require.resolve('../jest__24.x')
              : require.resolve('../webpack__4.x')
          )
        );
      }
    },
    StringLiteral(path) {
      if (path.node.value == 'node' && findParentSpawnSync(path)) {
        path.replaceWithSourceString(`'${process.argv0}'`);
      }
    },
  });

  function findParentSpawnSync(path: NodePath<any>) {
    return path.findParent(
      path =>
        t.isCallExpression(path.node) &&
        t.isMemberExpression(path.node.callee) &&
        t.isIdentifier(path.node.callee.object) &&
        path.node.callee.object.name == 'spawn' &&
        t.isIdentifier(path.node.callee.property) &&
        path.node.callee.property.name == 'sync'
    );
  }

  return generate(ast).code;
}
