import path from 'path';

import { executeTests } from './common';

executeTests({
  ['next']: {
    ['9.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/next__9.x'),
      command: 'next build',
      outputDir: '.next',
      outputContents: {
        '.next/static/chunks/pages/index-*.js': 'Hi, Next 9.x.',
      },
      testDryRun: true,
      testUnregister: true,
      // Won't test 'next' global because it even fails on its bare own
    },
  },
});
