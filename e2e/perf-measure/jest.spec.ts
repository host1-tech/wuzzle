import execa from 'execa';
import path from 'path';

import { genEndToEndExec } from '../utils';
import { executeTests } from './common';

executeTests({
  ['jest']: {
    ['26.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/jest__26.x'),
      bareExec: path.join(__dirname, 'fixtures/jest__26.x/node_modules/.bin', 'jest -i'),
      wuzzleExec: genEndToEndExec({ command: 'jest -i -P "src/**/*.js"' }),
      cleanup() {
        execa.commandSync(genEndToEndExec({ command: 'unregister jest' }));
      },
      tmplContent:
        `<% _.times(lineCount, i => { %>` +
        `export const getGreeting<%= i %> = async () => 'Hi, <%= i %>.';
<% }); %>`,
      tmplTesting:
        `import * as $ from '.';
<% _.times(lineCount, i => { %>` +
        `it('Hi, <%= i %>.', async () => expect(await $.getGreeting<%= i %>()).toBe('Hi, <%= i %>.'));
<% }); %>`,
      totalTestFileCounts: { ['only a few']: 2, ['plenty of']: 20 },
      perSubDirTestFileCounts: { ['non-overlapping']: 1, ['25%-overlapping']: 2 },
      perFileLineCounts: { ['small']: 1, ['big']: 500 },
    },
  },
});
