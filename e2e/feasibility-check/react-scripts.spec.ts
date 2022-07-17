import path from 'path';

import { executeTests } from './common';

executeTests({
  ['react-scripts build']: {
    ['3.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/react-scripts__3.x'),
      command: 'react-scripts build',
      outputDir: 'build',
      outputContents: {
        ['build/static/js/main.*?(.chunk).js']: 'Hi, CRA 3.x.',
      },
      testGlobal: true,
      testDryRun: true,
      testUnregister: { envOverrides: { SKIP_PREFLIGHT_CHECK: 'true' } },
    },
    ['4.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/react-scripts__4.x'),
      command: 'react-scripts build',
      outputDir: 'build',
      outputContents: {
        ['build/static/js/main.*?(.chunk).js']: 'Hi, CRA 4.x.',
      },
      testGlobal: true,
      testDryRun: true,
      testUnregister: { envOverrides: { SKIP_PREFLIGHT_CHECK: 'true' } },
    },
    ['5.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/react-scripts__5.x'),
      command: 'react-scripts build',
      outputDir: 'build',
      outputContents: {
        ['build/static/js/main.*?(.chunk).js']: 'Hi, CRA 5.x.',
      },
      testGlobal: true,
      testDryRun: true,
      testUnregister: { envOverrides: { SKIP_PREFLIGHT_CHECK: 'true' } },
    },
  },
  ['react-scripts test']: {
    ['3.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/react-scripts__3.x'),
      command: 'react-scripts test --watchAll=false',
      outputMessages: ['Hi, CRA 3.x.'],
      debugTexts: ['Jest config with difference:', 'Webpack config with difference:'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: { envOverrides: { SKIP_PREFLIGHT_CHECK: 'true' } },
    },
    ['4.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/react-scripts__4.x'),
      command: 'react-scripts test --watchAll=false',
      outputMessages: ['Hi, CRA 4.x.'],
      debugTexts: ['Jest config with difference:', 'Webpack config with difference:'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: { envOverrides: { SKIP_PREFLIGHT_CHECK: 'true' } },
    },
    ['5.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/react-scripts__5.x'),
      command: 'react-scripts test --watchAll=false',
      outputMessages: ['Hi, CRA 5.x.'],
      debugTexts: ['Jest config with difference:', 'Webpack config with difference:'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: { envOverrides: { SKIP_PREFLIGHT_CHECK: 'true' } },
    },
  },
  ['react-scripts test --no-webpack']: {
    ['3.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/react-scripts__3.x'),
      command: 'react-scripts test --no-webpack --watchAll=false',
      outputMessages: ['Hi, CRA 3.x.'],
      debugTexts: ['Jest config with difference:'],
      debugTextsNotExpected: ['Webpack config with difference:'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: { envOverrides: { SKIP_PREFLIGHT_CHECK: 'true' } },
    },
    ['4.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/react-scripts__4.x'),
      command: 'react-scripts test --no-webpack --watchAll=false',
      outputMessages: ['Hi, CRA 4.x.'],
      debugTexts: ['Jest config with difference:'],
      debugTextsNotExpected: ['Webpack config with difference:'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: { envOverrides: { SKIP_PREFLIGHT_CHECK: 'true' } },
    },
    ['5.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/react-scripts__5.x'),
      command: 'react-scripts test --no-webpack --watchAll=false',
      outputMessages: ['Hi, CRA 5.x.'],
      debugTexts: ['Jest config with difference:'],
      debugTextsNotExpected: ['Webpack config with difference:'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: { envOverrides: { SKIP_PREFLIGHT_CHECK: 'true' } },
    },
  },
});
