import { logError, logPlain, resolveCommandPath, resolveWebpackSemVer } from '@wuzzle/helpers';

import { EXIT_CODE_ERROR } from '../constants';
import { doFileRegistering, execNode, LaunchFunction, tmplLogForGlobalResolving } from '../utils';

export const launchDefault: LaunchFunction = ({ nodePath, args, projectPath, commandName }) => {
  let defaultCommandPath: string;
  let webpackMajorVersion: number;
  try {
    try {
      defaultCommandPath = resolveCommandPath({ cwd: projectPath, commandName });
    } catch {
      defaultCommandPath = resolveCommandPath({ cwd: projectPath, commandName, fromGlobals: true });
      logPlain(tmplLogForGlobalResolving({ commandName, commandPath: defaultCommandPath }));
    }
    webpackMajorVersion = resolveWebpackSemVer(defaultCommandPath).major;
  } catch {
    logError(`error: command '${commandName}' not supported.`);
    process.exit(EXIT_CODE_ERROR);
  }

  doFileRegistering({
    registerName: 'webpack',
    majorVersion: webpackMajorVersion,
    commandPath: defaultCommandPath,
  });
  execNode({ nodePath, execArgs: [defaultCommandPath, ...args] });
};
