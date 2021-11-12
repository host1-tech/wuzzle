import generate from '@babel/generator';
import { parse } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { backupWithRestore, resolveRequire, tryRestoreWithRemove } from '@wuzzle/helpers';
import fs from 'fs';
import path from 'path';
import { EK_DRY_RUN, ENCODING_TEXT } from '../../constants';
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
        path.parent.callee.name === 'getNormalizedWebpackOptions' &&
        findUpArrowFunctionCreateCompiler(path)
      ) {
        path.replaceWithSourceString(
          `require('${resolveRequire('../../apply-config').replace(/\\/g, '\\\\')}').default(${
            path.node.name
          },require('..'))`
        );
      }

      if (
        path.node.name === 'options' &&
        t.isVariableDeclarator(path.parent) &&
        t.isCallExpression(path.parent.init) &&
        t.isIdentifier(path.parent.init.callee) &&
        path.parent.init.callee.name === 'getNormalizedWebpackOptions' &&
        path.parentPath.parentPath &&
        findUpArrowFunctionCreateCompiler(path)
      ) {
        path.parentPath.parentPath.insertAfter(
          parse(`if(process.env.${EK_DRY_RUN})process.exit();`).program.body[0]
        );
      }
    },
  });

  return generate(ast).code;
}

function findUpArrowFunctionCreateCompiler<T extends t.Node>(path: NodePath<T>) {
  const parentPath = path.findParent(p => p.isArrowFunctionExpression());
  if (
    t.isArrowFunctionExpression(parentPath) &&
    t.isVariableDeclarator(parentPath.parent) &&
    t.isIdentifier(parentPath.parent.id) &&
    parentPath.parent.id.name === 'createCompiler'
  ) {
    return parentPath;
  }
}
