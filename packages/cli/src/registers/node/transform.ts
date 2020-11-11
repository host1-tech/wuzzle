import execa from 'execa';
import { calculateNodePathForTransformCli } from './utils';

export function transform(code: string, file: string): string {
  const transformCliPath = require.resolve('./transform-cli');
  const nodePath = calculateNodePathForTransformCli(transformCliPath);
  const args = [transformCliPath, file];
  const { stdout, stderr } = execa.sync(nodePath, args, { input: code });
  process.stderr.write(stderr);
  return stdout;
}
