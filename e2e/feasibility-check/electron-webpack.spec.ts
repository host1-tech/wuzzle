import path from 'path';
import { executeTests } from './common';

executeTests({
  ['electron-webpack']: {
    ['2.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/electron-webpack__2.x'),
      command: 'electron-webpack --progress=false',
      outputDir: 'dist',
      outputContents: {
        ['dist/renderer/renderer.js']: 'Welcome to your new project!',
      },
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
  },
});
