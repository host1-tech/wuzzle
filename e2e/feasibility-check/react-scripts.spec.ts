import path from 'path';
import { executeTests } from './common';

executeTests({
  ['react-scripts build']: {
    ['3.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/react-scripts__3.x'),
      command: 'react-scripts build',
      outputDir: 'build',
      outputContents: {
        ['build/static/js/main.*.chunk.js']: 'Hi, CRA 3.x.',
      },
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
    ['4.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/react-scripts__4.x'),
      command: 'react-scripts build',
      outputDir: 'build',
      outputContents: {
        ['build/static/js/main.*.chunk.js']: 'Hi, CRA 4.x.',
      },
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
  },
  ['react-scripts test']: {
    ['3.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/react-scripts__3.x'),
      command: 'react-scripts test',
      envOverrides: { CI: 'true' },
      outputMessages: ['Hi, CRA 3.x.'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
    ['4.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/react-scripts__4.x'),
      command: 'react-scripts test',
      envOverrides: { CI: 'true' },
      outputMessages: ['Hi, CRA 4.x.'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
  },
});
