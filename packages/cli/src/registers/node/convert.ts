import getStream from 'get-stream';
import { transpile } from '../../transpile';

const [, , inputCodePath] = process.argv;

(async () => {
  const inputCode = await getStream(process.stdin);
  const outputCode = await transpile({
    inputCode,
    inputCodePath,
    webpackConfig: {
      devtool: 'inline-cheap-module-source-map',
    },
  });
  process.stdout.write(outputCode);
})();
