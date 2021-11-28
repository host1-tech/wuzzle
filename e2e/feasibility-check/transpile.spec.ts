import path from 'path';
import { executeTests } from './common';

executeTests({
  ['transpile']: {
    ['current']: {
      fixtureDir: path.join(__dirname, 'fixtures/transpile'),
      command: `transpile 'src/**/*.js' -d lib`,
      outputDir: 'lib',
      outputContents: {
        ['lib/index.js']: 'Hi, WT.',
      },
      testDryRun: true,
    },
  },
});
