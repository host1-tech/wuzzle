import path from 'path';

import { executeTests } from './common';

executeTests({
  ['vue-cli-service build']: {
    ['4.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/vue-cli-service__4.x'),
      command: 'vue-cli-service build',
      outputDir: 'dist',
      outputContents: {
        ['dist/js/app.js']: 'Hi, Vue CLI 4.x.',
      },
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
  },

  ['vue-cli-service test:unit/jest']: {
    ['4.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/vue-cli-service-jest__4.x'),
      command: 'vue-cli-service test:unit',
      outputMessages: ['Hi, Vue CLI 4.x.'],
      debugTexts: ['Jest config with difference:', 'Webpack config with difference:'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
  },

  ['vue-cli-service test:unit/jest --no-webpack']: {
    ['4.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/vue-cli-service-jest__4.x'),
      command: 'vue-cli-service test:unit --no-webpack',
      outputMessages: ['Hi, Vue CLI 4.x.'],
      debugTexts: ['Jest config with difference:'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
  },

  ['vue-cli-service test:unit/mocha']: {
    ['4.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/vue-cli-service-mocha__4.x'),
      command: 'vue-cli-service test:unit',
      outputMessages: ['Hi, Vue CLI 4.x.'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
  },

  ['vue-cli-service test:e2e/cypress']: {
    ['4.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/vue-cli-service-cypress__4.x'),
      command: 'vue-cli-service test:e2e --headless',
      outputMessages: ['Hi, Vue CLI 4.x.'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
  },
});
