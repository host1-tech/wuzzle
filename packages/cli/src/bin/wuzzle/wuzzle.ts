import { logError, resolveRequire } from '@wuzzle/helpers';
import { EK, EXIT_CODE_ERROR } from '../../constants';
import {
  launchCypress,
  launchDefault,
  launchJest,
  launchMocha,
  launchNode,
  launchRazzle,
  launchReactScripts,
  launchStorybook,
  launchVueCliService,
} from '../../launches';
import { checkToUseDryRunMode, envSet, LaunchFunction, locateProjectAnchor } from '../../utils';

const projectPath = locateProjectAnchor();
const [nodePath, , commandName, ...args] = process.argv;

if (!commandName) {
  logError('error: command name not specified.');
  process.exit(EXIT_CODE_ERROR);
}

checkToUseDryRunMode(args);

// Set command env variables to help wuzzle user config setup
envSet(EK.COMMAND_NAME, commandName);
envSet(EK.COMMAND_ARGS, args);

const entries: Record<string, LaunchFunction> = {
  ['transpile']: () => {
    process.argv.splice(1, 2, resolveRequire('../wuzzle-transpile'));
    require('../wuzzle-transpile');
  },
  ['unregister']: () => {
    process.argv.splice(1, 2, resolveRequire('../wuzzle-unregister'));
    require('../wuzzle-unregister');
  },
  ['cypress']: launchCypress,
  ['jest']: launchJest,
  ['mocha']: launchMocha,
  ['node']: launchNode,
  ['razzle']: launchRazzle,
  ['react-scripts']: launchReactScripts,
  ['build-storybook']: launchStorybook,
  ['start-storybook']: launchStorybook,
  ['storybook-server']: launchStorybook,
  ['vue-cli-service']: launchVueCliService,
};
(entries[commandName] ?? launchDefault)({ nodePath, args, projectPath, commandName });
