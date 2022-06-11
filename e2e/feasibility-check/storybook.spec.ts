import path from 'path';

import { executeTests } from './common';

executeTests({
  ['storybook']: {
    ['6.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/storybook__6.x'),
      command: 'build-storybook --quiet',
      outputDir: 'storybook-static',
      outputContents: {
        ['storybook-static/main.*.iframe.bundle.js']: 'Hi, Storybook 6.x.',
      },
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
  },
});
