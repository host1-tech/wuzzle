import path from 'path';
import { genEndToEndExec } from '../utils';
import { executeTests } from './common';

executeTests({
  ['node']: {
    ['current']: {
      fixtureDir: path.join(__dirname, 'fixtures/node'),
      bareExec: `${process.argv[0]} -r @babel/register index.js`,
      wuzzleExec: genEndToEndExec({ command: 'node index.js' }),
      tmplContent:
        `<% _.times(lineCount, i => { %>` +
        `export const getGreeting<%= i %> = async () => 'Hi, <%= i %>.';
<% }); %>`,
      tmplTesting: '',
      totalTestFileCounts: { ['only a few']: 2, ['plenty of']: 20 },
      perSubDirTestFileCounts: { ['non-overlapping']: 1, ['25%-overlapping']: 2 },
      perFileLineCounts: { ['small']: 1, ['big']: 500 },
    },
  },
});
