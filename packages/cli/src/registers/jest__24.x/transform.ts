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
          path =>
            t.isVariableDeclarator(path.node) &&
            t.isIdentifier(path.node.id) &&
            path.node.id.name == 'runCLI'
        )
      ) {
        const targetPath = path.findParent(
          path =>
            t.isVariableDeclaration(path.node) &&
            path.node.declarations.some(
              node => t.isIdentifier(node.id) && node.id.name == 'configs'
            )
        );

        if (targetPath) {
          const transformerPath = require.resolve('./transformer').replace(/\\/g, '\\\\');

          const { program } = parse(
            `configs.forEach(config => config.transform.splice(` +
              `0, config.transform.length, ['.', '${transformerPath}']));`
          );

          targetPath.insertAfter(program.body[0]);
        }
      }
    },
  });

  return generate(ast).code;
}
