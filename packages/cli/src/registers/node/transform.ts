import execa from 'execa';

export function transform(code: string, file: string): string {
  const convertPath = require.resolve('./convert');
  const nodePath = process.argv[0];
  const { stdout, stderr } = execa.sync(nodePath, [convertPath, file], { input: code });
  process.stderr.write(stderr);
  return stdout;
}
