import generate from '@babel/generator';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { EK_COMMAND_ARGS } from '../../constants';

const reactScriptsCommand = JSON.parse(process.env[EK_COMMAND_ARGS]!)[0];

export const match = /node_modules[\\/]react-scripts[\\/]bin[\\/]react-scripts\.js$/;

export function transform(code: string): string {
  const ast = parse(code);

  traverse(ast, {
    VariableDeclarator(path) {
      if (
        t.isIdentifier(path.node.id) &&
        path.node.id.name == 'nodeArgs' &&
        t.isVariableDeclaration(path.parent)
      ) {
        const { program } = parse(
          `nodeArgs.push('-r', '${
            reactScriptsCommand == 'test'
              ? require.resolve('../jest__24.x')
              : require.resolve('../webpack__4.x')
          }')`
        );
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
        path.replaceWithSourceString(`'${process.argv[0]}'`);
      }
    },
  });

  return generate(ast).code;
}
