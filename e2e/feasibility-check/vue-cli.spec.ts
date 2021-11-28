import path from 'path';
import { executeTests } from './common';

executeTests({
  ['vue-cli build']: {
    ['4.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/vue-cli__4.x'),
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
});
