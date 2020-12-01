import execa from 'execa';

export function transform(code: string, file: string): string {
  const transformCliPath = require.resolve('./transform-cli');
  const nodePath = process.argv[0];
  const { stdout, stderr } = execa.sync(nodePath, [transformCliPath, file], { input: code });
  process.stderr.write(stderr);
  return stdout;
}
