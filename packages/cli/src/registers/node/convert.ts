import getStream from 'get-stream';
import { transpile } from '../../transpile';

const [, , inputCodePath, inputCodeEncoding] = process.argv;

(async () => {
  const inputCode = await getStream(process.stdin);
  const outputCode = await transpile({
    inputCode,
    inputCodePath,
    inputCodeEncoding,
    webpackConfig: {
      devtool: 'inline-cheap-module-source-map',
    },
  });
  process.stdout.write(outputCode);
})();
