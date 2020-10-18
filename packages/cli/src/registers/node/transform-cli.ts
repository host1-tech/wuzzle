import transpile from '../../transpile';

const [, , inputCodePath] = process.argv;

async function readInputCode(): Promise<string> {
  const chunks: Buffer[] = [];
  return await new Promise<string>((resolve, reject) => {
    process.stdin.on('data', chunk => chunks.push(chunk));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    process.stdin.on('error', reject);
  });
}

(async () => {
  const inputCode = await readInputCode();
  const outputCode = await transpile({
    inputCode,
    inputCodePath,
    webpackConfig: {
      mode: 'development',
      target: 'node',
      devtool: 'inline-cheap-module-source-map',
    },
  });
  process.stdout.write(outputCode);
})();
