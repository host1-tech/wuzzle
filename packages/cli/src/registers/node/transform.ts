import execa from 'execa';
import { calculateNodePathForTransformCli } from './utils';

export function transform(code: string, file: string): string {
  const transformCliPath = require.resolve('./transform-cli');
  const nodePath = calculateNodePathForTransformCli(transformCliPath);
  const { stdout, stderr } = execa.sync(nodePath, [transformCliPath, file], { input: code });
  process.stderr.write(stderr);
  return stdout;
}
