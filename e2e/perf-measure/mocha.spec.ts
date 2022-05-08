import execa from 'execa';
import path from 'path';
import { genEndToEndExec } from '../utils';
import { executeTests } from './common';

executeTests({
  ['mocha']: {
    ['8.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/mocha__8.x'),
      bareExec: path.join(
        __dirname,
        'fixtures/mocha__8.x/node_modules/.bin',
        `mocha -r @babel/register -j 1 "src/**/*"`
      ),
      wuzzleExec: genEndToEndExec({ command: `mocha -j 1 -P "src/**/*" "src/**/*"` }),
      cleanup() {
        execa.commandSync(genEndToEndExec({ command: 'unregister mocha' }));
      },
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
