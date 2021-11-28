import path from 'path';
import { executeTests } from './common';

executeTests({
  ['jest']: {
    ['24.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/jest__24.x'),
      command: 'jest',
      outputMessages: ['Hi, Jest 24.x.'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
    ['25.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/jest__25.x'),
      command: 'jest',
      outputMessages: ['Hi, Jest 25.x.'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
    ['26.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/jest__26.x'),
      command: 'jest',
      outputMessages: ['Hi, Jest 26.x.'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
    ['27.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/jest__27.x'),
      command: 'jest',
      outputMessages: ['Hi, Jest 27.x.'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
  },
});
