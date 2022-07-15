import { logError, logPlain, resolveCommandPath, resolveCommandSemVer } from '@wuzzle/helpers';

import { EXIT_CODE_ERROR } from '../constants';
import { doFileRegistering, execNode, LaunchFunction, tmplLogForGlobalResolving } from '../utils';

export const launchStorybook: LaunchFunction = ({ nodePath, args, projectPath, commandName }) => {
  let storybookCommandPath: string;
  let storybookMajorVersion: number;
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
    storybookMajorVersion = resolveCommandSemVer(storybookCommandPath).major;
  } catch {
    logError(`error: command '${commandName}' not supported.`);
    process.exit(EXIT_CODE_ERROR);
  }

  doFileRegistering({
    registerName: 'storybook',
    majorVersion: storybookMajorVersion,
    commandPath: storybookCommandPath,
  });

  execNode({ nodePath, execArgs: [storybookCommandPath, ...args] });
};
