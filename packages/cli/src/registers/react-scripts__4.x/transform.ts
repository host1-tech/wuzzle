import generate from '@babel/generator';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { resolveRequire } from '@wuzzle/helpers';
import { addHook } from 'pirates';
import { EK_COMMAND_ARGS } from '../../constants';

export function register() {
  const match = /node_modules[\\/]react-scripts[\\/]bin[\\/]react-scripts\.js$/;

  const piratesOptions = {
    exts: ['.js'],
    matcher: (filepath: string) => match.test(filepath),
    ignoreNodeModules: false,
  };

  addHook(transform, piratesOptions);
}

export function transform(code: string): string {
  const reactScriptsCommand = JSON.parse(process.env[EK_COMMAND_ARGS]!)[0];
  const ast = parse(code);

  traverse(ast, {
    VariableDeclarator(path) {
      if (
        t.isIdentifier(path.node.id) &&
        path.node.id.name === 'nodeArgs' &&
        t.isVariableDeclaration(path.parent)
      ) {
        const registerPath = resolveRequire(
          reactScriptsCommand === 'test' ? '../jest__26.x' : '../webpack__4.x'
        );
        const { program } = parse(`nodeArgs.push('-r', '${registerPath.replace(/\\/g, '\\\\')}')`);
        path.parentPath.insertAfter(program.body[0]);
      }
    },
  });

  return generate(ast).code;
}
