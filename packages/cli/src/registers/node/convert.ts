import getStream from 'get-stream';

import { logError } from '@wuzzle/helpers';

import { EXIT_CODE_ERROR } from '../../constants';
import { transpile, TranspileOptions } from '../../transpile';

(async () => {
  const transpileOptions: TranspileOptions = JSON.parse(await getStream(process.stdin));
  const outputCode = await transpile(transpileOptions);
  process.stdout.write(outputCode);
})().catch(e => {
  logError(e);
  process.exit(EXIT_CODE_ERROR);
});
