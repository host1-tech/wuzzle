import path from 'path';
import { executeTests } from './common';

executeTests({
  ['taro build:h5']: {
    ['2.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/taro__2.x'),
      command: 'taro build --type=h5',
      outputDir: 'dist',
      outputContents: {
        ['dist/chunk/index_index.js']: 'Hi, Taro 2.x.',
      },
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
  },
  ['taro build:weapp']: {
    ['2.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/taro__2.x'),
      command: 'taro build --type=weapp',
      outputDir: 'dist',
      outputContents: {
        ['dist/pages/index/index.wxml']: 'Hi, Taro 2.x.',
      },
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
  },
});
