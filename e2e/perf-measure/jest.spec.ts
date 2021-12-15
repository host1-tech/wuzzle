import path from 'path';
import { executeTests } from './common';

const bareCommand = 'jest -i';
const wuzzleCommand = bareCommand;

const tmplContent =
  `<% _.times(lineCount, i => { %>` +
  `export const getGreeting<%= i %> = async () => 'Hi, <%= i %>.';
<% }); %>`;
const tmplTesting =
  `import * as $ from '.';
<% _.times(lineCount, i => { %>` +
  `it('Hi, <%= i %>.', async () => expect(await $.getGreeting<%= i %>()).toBe('Hi, <%= i %>.'));
<% }); %>`;

const totalFileCounts = { ['only a few']: 2, ['plenty of']: 20 };
const perSubDirFileCounts = { ['non-overlapping']: 1, ['25%-overlapping']: 2 };
const perFileLineCounts = { ['small']: 1, ['big']: 500 };

executeTests({
  ['jest']: {
    ['26.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/jest__26.x'),
      bareCommand,
      wuzzleCommand,
      tmplContent,
      tmplTesting,
      totalFileCounts,
      perSubDirFileCounts,
      perFileLineCounts,
    },
    ['27.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/jest__27.x'),
      bareCommand,
      wuzzleCommand,
      tmplContent,
      tmplTesting,
      totalFileCounts,
      perSubDirFileCounts,
      perFileLineCounts,
    },
  },
});
