import generate from '@babel/generator';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { resolveRequire } from '@wuzzle/helpers';
import { EK } from '../../constants';
import { createRegisterUnregister, envGet } from '../../utils';

export const [register, unregister] = createRegisterUnregister({
  moduleName: 'jest',
  moduleToMatch: '@jest/core/build/cli',
  transform,
});

export function transform(code: string): string {
  const ast = parse(code);

  traverse(ast, {
    Identifier(path) {
      if (
        path.node.name === 'readConfigs' &&
        path.findParent(
          path =>
            (t.isFunctionDeclaration(path.node) &&
              t.isIdentifier(path.node.id) &&
              path.node.id.name === 'runCLI') ||
            (t.isVariableDeclarator(path.node) &&
              t.isIdentifier(path.node.id) &&
              path.node.id.name === 'runCLI')
        )
      ) {
        const targetPath = path.findParent(
          path =>
            t.isVariableDeclaration(path.node) &&
            t.isVariableDeclarator(path.node.declarations[0]) &&
            t.isObjectPattern(path.node.declarations[0].id) &&
            path.node.declarations[0].id.properties.some(
              node => t.isProperty(node) && t.isIdentifier(node.key) && node.key.name === 'configs'
            )
        );

        if (targetPath) {
          const { webpack } = envGet(EK.JEST_EXTRA_OPTIONS);
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
            `if(process.env.${EK.DRY_RUN}){` +
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
