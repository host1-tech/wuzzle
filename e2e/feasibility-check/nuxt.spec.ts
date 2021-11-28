import path from 'path';
import { executeTests } from './common';

executeTests({
  ['nuxt']: {
    ['2.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/nuxt__2.x'),
      command: 'nuxt build',
      outputDir: '.nuxt',
      outputContents: {
        '.nuxt/dist/client/*.js': 'Hi, Nuxt 2.x.',
      },
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
  },
});
