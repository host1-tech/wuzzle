import { resolveRequire } from '@wuzzle/helpers';
import { EK_COMMAND_ARGS, EK_COMMAND_NAME, EXIT_CODE_ERROR } from '../../constants';
import {
  launchDefault,
  launchJest,
  launchMocha,
  launchNode,
  launchRazzle,
  launchReactScripts,
} from '../../launches';
import { checkToUseDryRunMode, LaunchFunction, locateProjectAnchor } from '../../utils';

const projectPath = locateProjectAnchor();
const [nodePath, , commandName, ...args] = process.argv;

if (!commandName) {
  console.error('error: command name not specified.');
  process.exit(EXIT_CODE_ERROR);
}

checkToUseDryRunMode(args);

// Set command env variables to help wuzzle user config setup
process.env[EK_COMMAND_NAME] = commandName;
process.env[EK_COMMAND_ARGS] = JSON.stringify(args);

const entries: Record<string, LaunchFunction> = {
  ['transpile']: () => {
    process.argv.splice(1, 2, resolveRequire('../wuzzle-transpile'));
    require('../wuzzle-transpile');
  },
  ['unregister']: () => {
    process.argv.splice(1, 2, resolveRequire('../wuzzle-unregister'));
    require('../wuzzle-unregister');
  },
  ['jest']: launchJest,
  ['mocha']: launchMocha,
  ['node']: launchNode,
  ['razzle']: launchRazzle,
  ['react-scripts']: launchReactScripts,
};
(entries[commandName] || launchDefault)({ nodePath, args, projectPath, commandName });
