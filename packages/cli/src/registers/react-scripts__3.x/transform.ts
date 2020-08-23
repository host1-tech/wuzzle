import generate from '@babel/generator';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

export const match = /node_modules[\\/]react-scripts[\\/]bin[\\/]react-scripts\.js$/;

export function transform(code: string): string {
  const ast = parse(code);
  const [nodePath] = process.argv;

  traverse(ast, {
    VariableDeclarator(path) {
      if (
        t.isIdentifier(path.node.id) &&
        path.node.id.name == 'nodeArgs' &&
        t.isVariableDeclaration(path.parent)
      ) {
        const { program } = parse(`nodeArgs.push('-r', '${require.resolve('../webpack__4.x')}')`);
        path.parentPath.insertAfter(program.body[0]);
      }
    },

    StringLiteral(path) {
      if (
        path.node.value == 'node' &&
        t.isCallExpression(path.parent) &&
        t.isMemberExpression(path.parent.callee) &&
        t.isIdentifier(path.parent.callee.object) &&
        path.parent.callee.object.name == 'spawn' &&
        t.isIdentifier(path.parent.callee.property) &&
        path.parent.callee.property.name == 'sync'
      ) {
        path.replaceWithSourceString(`'${nodePath}'`);
      }
    },
  });

  return generate(ast).code;
}
