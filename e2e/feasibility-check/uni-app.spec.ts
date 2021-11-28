import path from 'path';
import { executeTests } from './common';

executeTests({
  ['uni-app build:h5']: {
    ['2.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/uni-app__2.x'),
      command: 'vue-cli-service uni-build',
      envOverrides: { UNI_PLATFORM: 'h5' },
      outputDir: 'dist',
      outputContents: {
        ['dist/dev/h5/static/js/pages-index-index.js']: 'Hi, uni-app 2.x.',
      },
      testDryRun: true,
      testUnregister: true,
      // Won't test 'uni-app' global because it fails on locating output dir
    },
  },
  ['uni-app build:mp-weixin']: {
    ['2.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/uni-app__2.x'),
      command: 'vue-cli-service uni-build',
      envOverrides: { UNI_PLATFORM: 'mp-weixin' },
      outputDir: 'dist',
      outputContents: {
        ['dist/dev/mp-weixin/pages/index/index.wxml']: 'Hi, uni-app 2.x.',
      },
      testDryRun: true,
      testUnregister: true,
      // Won't test 'uni-app' global because it fails on locating output dir
    },
  },
});
