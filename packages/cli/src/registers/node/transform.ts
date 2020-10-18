import execa from 'execa';
import path from 'path';

export function transform(code: string, file: string): string {
  const transformCliPath = require.resolve('./transform-cli');
  const { ext } = path.parse(transformCliPath);
  const nodePath = ext == '.ts' ? 'ts-node' : process.argv0;
  const args = [require.resolve('./transform-cli'), file];
  const { stdout, stderr } = execa.sync(nodePath, args, { input: code });
  process.stderr.write(stderr);
  return stdout;
}
