import path from 'path';
import { executeTests } from './common';

executeTests({
  ['node']: {
    ['current']: {
      fixtureDir: path.join(__dirname, 'fixtures/node'),
      command: 'node src/index.js',
      outputMessages: ['Hi, Node.'],
      testDryRun: true,
    },
  },
});
