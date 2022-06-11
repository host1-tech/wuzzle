import path from 'path';

import { executeTests } from './common';

executeTests({
  ['cypress']: {
    ['9.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/cypress__9.x'),
      command: 'cypress run --headless',
      outputMessages: ['Hi, Cypress 9.x.'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
  },
});
