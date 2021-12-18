import path from 'path';
import shelljs from 'shelljs';
import { executeTests } from './common';

executeTests({
  ['transpile']: {
    ['current']: {
      fixtureDir: path.join(__dirname, 'fixtures/transpile'),
      bareCommand: `babel 'src' --ignore '**/*.test.js' -d out`,
      wuzzleCommand: `transpile 'src/**/*' --ignore '**/*.test.js' --no-clean -d out`,
      cleanup() {
        shelljs.rm('-fr', 'out');
      },
      tmplContent:
        `<% _.times(lineCount, i => { %>` +
        `export const getGreeting<%= i %> = async () => 'Hi, <%= i %>.';
<% }); %>`,
      tmplTesting: '',
      totalTestFileCounts: { ['only a few']: 2, ['plenty of']: 100 },
      perSubDirTestFileCounts: { ['plain']: 1 },
      perFileLineCounts: { ['small']: 1, ['big']: 500 },
    },
  },
});
