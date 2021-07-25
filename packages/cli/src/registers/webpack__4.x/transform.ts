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

  let targetId: t.Identifier;
  traverse(ast, {
    StringLiteral(path) {
      if (
        path.node.value === './WebpackOptionsDefaulter' &&
        t.isCallExpression(path.parent) &&
        t.isVariableDeclarator(path.parentPath.parent) &&
        t.isIdentifier(path.parentPath.parent.id)
      ) {
        targetId = path.parentPath.parent.id;
      }
    },

    Identifier(path) {
      if (
        path.node.name === 'options' &&
        t.isCallExpression(path.parent) &&
        t.isMemberExpression(path.parent.callee) &&
        t.isNewExpression(path.parent.callee.object) &&
        t.isIdentifier(path.parent.callee.object.callee) &&
        path.parent.callee.object.callee.name === targetId.name &&
        t.isIdentifier(path.parent.callee.property) &&
        path.parent.callee.property.name === 'process'
      ) {
        path.replaceWithSourceString(
          `require('${resolveRequire('../../apply-config').replace(/\\/g, '\\\\')}').default(${
            path.node.name
          })`
        );
      }
    },
  });

  return generate(ast).code;
}
