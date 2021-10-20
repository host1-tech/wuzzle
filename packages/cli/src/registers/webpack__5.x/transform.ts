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

  traverse(ast, {
    Identifier(path) {
      if (
        path.node.name === 'rawOptions' &&
        t.isCallExpression(path.parent) &&
        t.isIdentifier(path.parent.callee) &&
        path.parent.callee.name === 'getNormalizedWebpackOptions'
      ) {
        const parentPath = path.findParent(p => p.isArrowFunctionExpression());
        if (
          t.isArrowFunctionExpression(parentPath) &&
          t.isVariableDeclarator(parentPath.parent) &&
          t.isIdentifier(parentPath.parent.id) &&
          parentPath.parent.id.name === 'createCompiler'
        ) {
          path.replaceWithSourceString(
            `require('${resolveRequire('../../apply-config').replace(/\\/g, '\\\\')}').default(${
              path.node.name
            },require('..'))`
          );
        }
      }
    },
  });

  return generate(ast).code;
}
