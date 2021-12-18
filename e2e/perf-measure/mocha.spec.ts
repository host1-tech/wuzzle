import path from 'path';
import { executeTests } from './common';

executeTests({
  ['mocha']: {
    ['8.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/mocha__8.x'),
      bareCommand: `mocha -r @babel/register -j 1 'src/**/*'`,
      wuzzleCommand: `mocha -j 1 'src/**/*'`,
      tmplContent:
        `<% _.times(lineCount, i => { %>` +
        `export const getGreeting<%= i %> = async () => 'Hi, <%= i %>.';
<% }); %>`,
      tmplTesting:
        `import assert from 'assert';
import * as $ from '.';
<% _.times(lineCount, i => { %>` +
        `it('Hi, <%= i %>.', async () => assert((await $.getGreeting<%= i %>()) === 'Hi, <%= i %>.'));
<% }); %>`,
      totalTestFileCounts: { ['only a few']: 2, ['plenty of']: 20 },
      perSubDirTestFileCounts: { ['non-overlapping']: 1, ['25%-overlapping']: 2 },
      perFileLineCounts: { ['small']: 1, ['big']: 500 },
    },
  },
});
