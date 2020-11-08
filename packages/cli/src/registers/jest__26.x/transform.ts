import generate from '@babel/generator';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

export const match = /node_modules[\\/]@jest[\\/]core[\\/]build[\\/]cli[\\/]index\.js$/;

export function transform(code: string): string {
  const ast = parse(code);

  traverse(ast, {
    Identifier(path) {
      if (
        path.node.name == 'readConfigs' &&
        path.findParent(
          path => t.isFunctionDeclaration(path.node) && path.node.id?.name == 'runCLI'
        )
      ) {
        const targetPath = path.findParent(
          path =>
            t.isVariableDeclaration(path.node) &&
            t.isObjectPattern(path.node.declarations[0]?.id) &&
            path.node.declarations[0].id.properties.some(
              node => t.isProperty(node) && t.isIdentifier(node.key) && node.key.name == 'configs'
            )
        );

        if (targetPath) {
          const transformerPath = require.resolve('./transformer');

          const { program } = parse(
            `configs.forEach(config => config.transform.splice(0, config.transform.length, ['.', '${transformerPath}', {}]));`
          );

          targetPath.insertAfter(program.body[0]);
        }
      }
    },
  });

  return generate(ast).code;
}
