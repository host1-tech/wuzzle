import { logError, logPlain, resolveCommandPath, resolveRequire } from '@wuzzle/helpers';
import { green } from 'chalk';
import path from 'path';
import glob from 'glob';
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

const runnerNames = ['cypress', 'jest', 'razzle', 'razzle', 'react-scripts', 'vue-cli-service'];
const runnerSubPath = runnerNames.includes(commandName) ? commandName : 'webpack';

function defaultResolver() {
  const commandPaths: string[] = [];
  try {
    commandPaths.push(resolveCommandPath({ cwd: projectPath, commandName }));
  } catch {}
  try {
    commandPaths.push(resolveCommandPath({ cwd: projectPath, commandName, fromGlobals: true }));
  } catch {}
  return commandPaths;
}
function storybookResolver() {
  return defaultResolver().reduce<string[]>((commandPaths, c) => {
    for (const webpackMajorVersion of [4, 5]) {
      try {
        commandPaths.push(
          resolveRequire(`@storybook/manager-webpack${webpackMajorVersion}`, {
            basedir: path.dirname(c),
          })
        );
      } catch {}
    }
    return commandPaths;
  }, []);
}
const resolvePossibleCommandPaths =
  (
    {
      ['build-storybook']: storybookResolver,
      ['start-storybook']: storybookResolver,
      ['storybook-server']: storybookResolver,
    } as Record<string, () => string[]>
  )[commandName] ?? defaultResolver;

for (const { unregister } of glob
  .sync(`../../registers/${runnerSubPath}__*/index.[jt]s`, {
    cwd: __dirname,
  })
  .map(require)) {
  for (const commandPath of resolvePossibleCommandPaths()) {
    try {
      unregister({ commandPath });
    } catch {}
  }
}

logPlain(green(`Reverted registering on '${commandName}'.`));
