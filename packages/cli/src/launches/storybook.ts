import path from 'path';

import { logError, logPlain, resolveCommandPath, resolveRequire } from '@wuzzle/helpers';

import { EXIT_CODE_ERROR } from '../constants';
import { doFileRegistering, execNode, LaunchFunction, tmplLogForGlobalResolving } from '../utils';

export const launchStorybook: LaunchFunction = ({ nodePath, args, projectPath, commandName }) => {
  let storybookCommandPath: string;
  try {
    try {
      storybookCommandPath = resolveCommandPath({ cwd: projectPath, commandName });
    } catch {
      storybookCommandPath = resolveCommandPath({
        cwd: projectPath,
        commandName,
        fromGlobals: true,
      });
      logPlain(tmplLogForGlobalResolving({ commandName, commandPath: storybookCommandPath }));
    }
  } catch {
    logError(`error: command '${commandName}' not supported.`);
    process.exit(EXIT_CODE_ERROR);
  }

  let didRegister = false;
  for (const webpackMajorVersion of [4, 5]) {
    try {
      const storybookManagerWebpackPath = resolveRequire(
        `@storybook/manager-webpack${webpackMajorVersion}`,
        { basedir: path.dirname(storybookCommandPath) }
      );
      doFileRegistering({
        registerName: 'webpack',
        majorVersion: webpackMajorVersion,
        attempts: 1,
        throwErr: true,
        commandPath: storybookManagerWebpackPath,
      });
      didRegister = true;
    } catch {}
  }

  if (!didRegister) {
    logError(`error: failed to register for command '${commandName}'.`);
    process.exit(EXIT_CODE_ERROR);
  }

  execNode({ nodePath, execArgs: [storybookCommandPath, ...args] });
};
