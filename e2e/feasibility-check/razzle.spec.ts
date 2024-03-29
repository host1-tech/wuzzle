import path from 'path';

import { executeTests } from './common';

executeTests({
  ['razzle build']: {
    ['3.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/razzle__3.x'),
      command: 'razzle build',
      outputDir: 'build',
      outputContents: {
        ['build/public/static/js/bundle.*.js']: 'Hi, Razzle 3.x.',
      },
      testGlobal: 'with-install',
      testDryRun: true,
      testUnregister: true,
    },
    ['4.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/razzle__4.x'),
      command: 'razzle build --noninteractive',
      outputDir: 'build',
      outputContents: {
        ['build/public/static/js/client.*.js']: 'Hi, Razzle 4.x.',
      },
      testGlobal: 'with-install',
      testDryRun: true,
      testUnregister: true,
    },
  },
  ['razzle test']: {
    ['3.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/razzle__3.x'),
      command: 'razzle test --env=jsdom --watchAll=false',
      outputMessages: ['Hi, Razzle 3.x.'],
      debugTexts: ['Jest config with difference:', 'Webpack config with difference:'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
    ['4.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/razzle__4.x'),
      command: 'razzle test --env=jsdom --no-watch',
      outputMessages: ['Hi, Razzle 4.x.'],
      debugTexts: ['Jest config with difference:', 'Webpack config with difference:'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
  },
  ['razzle test --no-webpack']: {
    ['3.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/razzle__3.x'),
      command: 'razzle test --no-webpack --env=jsdom --watchAll=false',
      outputMessages: ['Hi, Razzle 3.x.'],
      debugTexts: ['Jest config with difference:'],
      debugTextsNotExpected: ['Webpack config with difference:'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
    ['4.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/razzle__4.x'),
      command: 'razzle test --no-webpack --env=jsdom --no-watch',
      outputMessages: ['Hi, Razzle 4.x.'],
      debugTexts: ['Jest config with difference:'],
      debugTextsNotExpected: ['Webpack config with difference:'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
  },
});
