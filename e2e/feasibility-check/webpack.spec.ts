import path from 'path';

import { executeTests } from './common';

executeTests({
  ['webpack']: {
    ['4.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/webpack__4.x'),
      command: 'webpack',
      outputDir: 'dist',
      outputContents: {
        ['dist/index.js']: 'Hi, Webpack 4.x.',
      },
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
    ['5.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/webpack__5.x'),
      command: 'webpack',
      outputDir: 'dist',
      outputContents: {
        ['dist/index.js']: 'Hi, Webpack 5.x.',
      },
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
  },
});
