import generate from '@babel/generator';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { backupWithRestore, resolveRequire, tryRestoreWithRemove } from '@wuzzle/helpers';
import fs from 'fs';
import path from 'path';
import { EK_DRY_RUN, ENCODING_TEXT } from '../../constants';
import { getCurrentJestExtraOptions, RegisterFunction } from '../../utils';

const modulesToMatch = ['jest-cli/build/cli', '@jest/core/build/cli'];

export const register: RegisterFunction = ({ commandPath }) => {
  let hasTransformed: boolean = false;
  for (const moduleToMatch of modulesToMatch) {
    let moduleFilepath: string | undefined;
    try {
      moduleFilepath = resolveRequire(moduleToMatch, {
        basedir: path.dirname(commandPath),
      });
    } catch {}
    if (!moduleFilepath) continue;
    backupWithRestore(moduleFilepath);
    const code = fs.readFileSync(moduleFilepath, ENCODING_TEXT);
    fs.writeFileSync(moduleFilepath, transform(code));
    hasTransformed = true;
  }
  if (!hasTransformed) throw new Error(`Cannot resolve jest from command path '${commandPath}'`);
};

export const unregister: RegisterFunction = ({ commandPath }) => {
  for (const moduleToMatch of modulesToMatch) {
    let moduleFilepath: string | undefined;
    try {
      moduleFilepath = resolveRequire(moduleToMatch, {
        basedir: path.dirname(commandPath),
      });
      tryRestoreWithRemove(moduleFilepath);
    } catch {}
  }
};

export function transform(code: string): string {
  const ast = parse(code);

  traverse(ast, {
    Identifier(path) {
      if (
        path.node.name === 'readConfigs' &&
        path.findParent(
          path =>
            t.isVariableDeclarator(path.node) &&
            t.isIdentifier(path.node.id) &&
            path.node.id.name === 'runCLI'
        )
      ) {
        const targetPath = path.findParent(
          path =>
            t.isVariableDeclaration(path.node) &&
            path.node.declarations.some(
              node => t.isIdentifier(node.id) && node.id.name === 'configs'
            )
        );

        if (targetPath) {
          const { webpack } = getCurrentJestExtraOptions();
          const toInsert = [
            // Register webpack based transformer
            webpack
              ? `configs.forEach(config => config.transform.splice(0,config.transform.length,` +
                `['.','${resolveRequire('./altered-transformer').replace(/\\/g, '\\\\')}',{}]));`
              : '',
            // Regsiter jest config modifier
            `configs.forEach(config => require('${resolveRequire('../../apply-config').replace(
              /\\/g,
              '\\\\'
            )}').applyJest(config,require('../..')));`,
            // Register dry-run mode handler
            `if(process.env.${EK_DRY_RUN}){` +
              (webpack
                ? `require('${resolveRequire('../node/transform').replace(
                    /\\/g,
                    '\\\\'
                  )}').printDryRunLog();`
                : '') +
              `process.exit();}`,
          ].join('');
          targetPath.insertAfter(parse(toInsert).program.body);
        }
      }
    },
  });

  return generate(ast).code;
}
