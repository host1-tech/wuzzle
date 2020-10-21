import generate from '@babel/generator';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

export const matches = {
  runnerJs: /node_modules[\\/]webpack-cli[\\/]lib[\\/]runner\.js$/,
  webpackJs: /node_modules[\\/]webpack[\\/]lib[\\/]webpack\.js$/,
};

export function transform(code: string, file: string): string {
  if (matches.webpackJs.test(file)) {
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
              `require('${require.resolve('../../applyConfig')}').default(${path.node.name})`
            );
          }
        }
      },
    });

    code = generate(ast).code;
  } else if (matches.runnerJs.test(file)) {
    const ast = parse(code);
    const [nodePath] = process.argv;

    traverse(ast, {
      StringLiteral(path) {
        if (path.node.value == 'node') {
          path.replaceWithSourceString(`'${nodePath}'`);
        }
      },
      Identifier(path) {
        if (path.node.name == 'cliPath' && t.isArrayExpression(path.parent)) {
          path.parent.elements.unshift(t.stringLiteral(require.resolve('./')));
          path.parent.elements.unshift(t.stringLiteral('-r'));
        }
      },
    });

    code = generate(ast).code;
  }

  return code;
}
