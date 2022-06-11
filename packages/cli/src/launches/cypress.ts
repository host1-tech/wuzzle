import { logError, logPlain, resolveCommandPath, resolveCommandSemVer } from '@wuzzle/helpers';

import { EXIT_CODE_ERROR } from '../constants';
import { doFileRegistering, execNode, LaunchFunction, tmplLogForGlobalResolving } from '../utils';

export const launchCypress: LaunchFunction = ({ nodePath, args, projectPath, commandName }) => {
  let cypressCommandPath: string;
  let cypressMajorVersion: number;
  try {
    try {
      cypressCommandPath = resolveCommandPath({ cwd: projectPath, commandName });
    } catch {
      cypressCommandPath = resolveCommandPath({ cwd: projectPath, commandName, fromGlobals: true });
      logPlain(tmplLogForGlobalResolving({ commandName, commandPath: cypressCommandPath }));
    }
    cypressMajorVersion = resolveCommandSemVer(cypressCommandPath).major;
  } catch {
    logError(`error: failed to resolve command '${commandName}'.`);
    process.exit(EXIT_CODE_ERROR);
  }

  doFileRegistering({
    registerName: 'cypress',
    majorVersion: cypressMajorVersion,
    commandPath: cypressCommandPath,
  });
  execNode({ nodePath, execArgs: [cypressCommandPath, ...args] });
};
