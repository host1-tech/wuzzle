import generate from '@babel/generator';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { resolveRequire } from '@wuzzle/helpers';
import { addHook } from 'pirates';

export function register() {
  const matches = [
    /node_modules[\\/]jest-cli[\\/]build[\\/]cli[\\/]index\.js$/,
    /node_modules[\\/]@jest[\\/]core[\\/]build[\\/]cli[\\/]index\.js$/,
  ];

  const piratesOptions = {
    exts: ['.js'],
    matcher: (filepath: string) => matches.some(m => m.test(filepath)),
    ignoreNodeModules: false,
  };

  addHook(transform, piratesOptions);
}

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
          const transformerPath = resolveRequire('./altered-transformer');

          const { program } = parse(
            `configs.forEach(config => config.transform.splice(` +
              `0, config.transform.length, ` +
              `['.', '${transformerPath.replace(/\\/g, '\\\\')}', {}]));`
          );

          targetPath.insertAfter(program.body[0]);
        }
      }
    },
  });

  return generate(ast).code;
}
