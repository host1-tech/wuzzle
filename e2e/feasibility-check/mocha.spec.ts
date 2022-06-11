import path from 'path';

import { executeTests } from './common';

executeTests({
  ['mocha']: {
    ['7.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/mocha__7.x'),
      command: 'mocha src/index.test.js',
      outputMessages: ['Hi, Mocha 7.x.'],
      testGlobal: true,
      testDryRun: true,
    },
    ['8.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/mocha__8.x'),
      command: 'mocha src/index.test.js',
      outputMessages: ['Hi, Mocha 8.x.'],
      testGlobal: true,
      testDryRun: true,
    },
  },
});
