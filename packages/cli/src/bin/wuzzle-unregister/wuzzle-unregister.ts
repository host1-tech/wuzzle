import { green } from 'chalk';
import glob from 'glob';

import { logError, logPlain, resolveCommandPath } from '@wuzzle/helpers';

import { EK, EXIT_CODE_ERROR } from '../../constants';
import { envSet, locateProjectAnchor } from '../../utils';

const projectPath = locateProjectAnchor();
const [, , commandName] = process.argv;

if (!commandName) {
  logError('error: command name not specified.');
  process.exit(EXIT_CODE_ERROR);
}

// Set command same env variables as 'wuzzle unregister'
envSet(EK.COMMAND_NAME, 'unregister');
envSet(EK.COMMAND_ARGS, process.argv.slice(2));

const registerName = [
  'cypress',
  'jest',
  'razzle',
  'razzle',
  'react-scripts',
  'vue-cli-service',
].includes(commandName)
  ? commandName
  : ['build-storybook', 'start-storybook', 'storybook-server'].includes(commandName)
  ? 'storybook'
  : 'webpack';

const commandPaths: string[] = [];
try {
  commandPaths.push(resolveCommandPath({ cwd: projectPath, commandName }));
} catch {}
try {
  commandPaths.push(resolveCommandPath({ cwd: projectPath, commandName, fromGlobals: true }));
} catch {}

for (const { unregister } of glob
  .sync(`../../registers/${registerName}__*/index.[jt]s`, {
    cwd: __dirname,
  })
  .map(require)) {
  for (const commandPath of commandPaths) {
    try {
      unregister({ commandPath });
    } catch {}
  }
}

logPlain(green(`Reverted registering on '${commandName}'.`));
