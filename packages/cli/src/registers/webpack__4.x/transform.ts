import generate from '@babel/generator';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { backupWithRestore, resolveRequire, tryRestoreWithRemove } from '@wuzzle/helpers';
import fs from 'fs';
import path from 'path';
import { ENCODING_TEXT } from '../../constants';
import { RegisterFunction } from '../../utils';

const moduleToMatch = 'webpack/lib/webpack';

export const register: RegisterFunction = ({ commandPath }) => {
  const moduleFilepath = resolveRequire(moduleToMatch, {
    basedir: path.dirname(commandPath),
  });
  backupWithRestore(moduleFilepath);
  const code = fs.readFileSync(moduleFilepath, ENCODING_TEXT);
  fs.writeFileSync(moduleFilepath, transform(code));
};

export const unregister: RegisterFunction = ({ commandPath }) => {
  const moduleFilepath = resolveRequire(moduleToMatch, {
    basedir: path.dirname(commandPath),
  });
  tryRestoreWithRemove(moduleFilepath);
};

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
          },require('..'))`
        );
      }
    },
  });

  return generate(ast).code;
}
