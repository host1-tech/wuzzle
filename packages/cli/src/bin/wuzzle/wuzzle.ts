import { resolveRequire } from '@wuzzle/helpers';
import findUp from 'find-up';
import path from 'path';
import {
  EK_COMMAND_ARGS,
  EK_COMMAND_NAME,
  EK_RPOJECT_ANCHOR,
  EXIT_CODE_ERROR,
} from '../../constants';
import {
  launchDefault,
  launchJest,
  launchMocha,
  launchNode,
  launchRazzle,
  launchReactScripts,
} from '../../launches';
import { LaunchFunction } from '../../utils';

const anchorName = process.env[EK_RPOJECT_ANCHOR] || 'package.json';
const anchorPath = findUp.sync(anchorName);

if (!anchorPath) {
  console.error(`error: '${anchorName}' not located.`);
  process.exit(EXIT_CODE_ERROR);
}

const projectPath = path.dirname(anchorPath);

const [nodePath, , commandName, ...args] = process.argv;

if (!commandName) {
  console.error('error: command name not specified.');
  process.exit(EXIT_CODE_ERROR);
}

// Set command env variables to help wuzzle user config setup
process.env[EK_COMMAND_NAME] = commandName;
process.env[EK_COMMAND_ARGS] = JSON.stringify(args);

const entries: Record<string, LaunchFunction> = {
  ['transpile']: () => {
    process.argv[1] = resolveRequire('../wuzzle-transpile');
    process.argv.splice(2, 1);
    require('../wuzzle-transpile');
  },
  ['jest']: launchJest,
  ['mocha']: launchMocha,
  ['node']: launchNode,
  ['razzle']: launchRazzle,
  ['react-scripts']: launchReactScripts,
};
(entries[commandName] || launchDefault)({ nodePath, args, projectPath, commandName });
