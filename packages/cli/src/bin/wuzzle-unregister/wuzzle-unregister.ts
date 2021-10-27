import { resolveCommandPath } from '@wuzzle/helpers';
import findUp from 'find-up';
import glob from 'glob';
import path from 'path';
import {
  EK_COMMAND_ARGS,
  EK_COMMAND_NAME,
  EK_RPOJECT_ANCHOR,
  EXIT_CODE_ERROR,
} from '../../constants';

const anchorName = process.env[EK_RPOJECT_ANCHOR] || 'package.json';
const anchorPath = findUp.sync(anchorName);

if (!anchorPath) {
  console.error(`error: '${anchorName}' not located.`);
  process.exit(EXIT_CODE_ERROR);
}

const projectPath = path.dirname(anchorPath);

const [, , commandName] = process.argv;

if (!commandName) {
  console.error('error: module name not specified.');
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
  unregister({ commandPath: resolveCommandPath({ cwd: projectPath, commandName }) });
}
