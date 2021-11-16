import { resolveCommandPath } from '@wuzzle/helpers';
import { green } from 'chalk';
import glob from 'glob';
import { EK_COMMAND_ARGS, EK_COMMAND_NAME, EXIT_CODE_ERROR } from '../../constants';
import { locateProjectAnchor } from '../../utils';

const projectPath = locateProjectAnchor();
const [, , commandName] = process.argv;

if (!commandName) {
  console.error('error: command name not specified.');
  process.exit(EXIT_CODE_ERROR);
}

// Set command same env variables as 'wuzzle unregister'
process.env[EK_COMMAND_NAME] = 'unregister';
process.env[EK_COMMAND_ARGS] = JSON.stringify(process.argv.slice(2));

const specialModules = ['jest', 'razzle', 'razzle', 'react-scripts'];
const targetPrefix = specialModules.includes(commandName) ? commandName : 'webpack';

for (const { unregister } of glob
  .sync(`../../registers/${targetPrefix}__*/index.[jt]s`, {
    cwd: __dirname,
  })
  .map(require)) {
  const commandPaths: string[] = [];
  try {
    commandPaths.push(resolveCommandPath({ cwd: projectPath, commandName }));
  } catch {}
  try {
    commandPaths.push(resolveCommandPath({ cwd: projectPath, commandName, fromGlobals: true }));
  } catch {}
  for (const commandPath of commandPaths) {
    unregister({ commandPath });
  }
}

console.log(green(`Reverted registers on '${commandName}'.`));
