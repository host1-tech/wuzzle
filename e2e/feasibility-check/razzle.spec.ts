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
      command: 'razzle build',
      envOverrides: { CI: 'true' },
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
      command: 'razzle test --env=jsdom',
      envOverrides: { CI: 'true' },
      outputMessages: ['Hi, Razzle 3.x.'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
    ['4.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/razzle__4.x'),
      command: 'razzle test --env=jsdom',
      envOverrides: { CI: 'true' },
      outputMessages: ['Hi, Razzle 4.x.'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
  },
});
