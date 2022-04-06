import { logError, logPlain, resolveCommandPath, resolveCommandSemVer } from '@wuzzle/helpers';
import {
  EK_COMMAND_ARGS,
  EK_REACT_SCRIPTS_SKIP_PREFLIGHT_CHECK,
  EXIT_CODE_ERROR,
} from '../constants';
import {
  applyJestExtraOptions,
  doFileRegistering,
  execNode,
  LaunchFunction,
  tmplLogForGlobalResolving,
} from '../utils';

export const launchReactScripts: LaunchFunction = ({
  nodePath,
  args,
  projectPath,
  commandName,
}) => {
  const reactScriptSubCommand = JSON.parse(process.env[EK_COMMAND_ARGS]!)[0];
  if (reactScriptSubCommand === 'test') {
    applyJestExtraOptions({ nodePath, name: 'wuzzle-react-scripts-test', args });
  }

  let reactScriptsCommandPath: string;
  let reactScriptsMajorVersion: number;
  try {
    try {
      reactScriptsCommandPath = resolveCommandPath({ cwd: projectPath, commandName });
    } catch {
      reactScriptsCommandPath = resolveCommandPath({
        cwd: projectPath,
        commandName,
        fromGlobals: true,
      });
      logPlain(tmplLogForGlobalResolving({ commandName, commandPath: reactScriptsCommandPath }));
    }
    reactScriptsMajorVersion = resolveCommandSemVer(reactScriptsCommandPath).major;
  } catch {
    logError(`error: failed to resolve command '${commandName}'.`);
    process.exit(EXIT_CODE_ERROR);
  }

  process.env[EK_REACT_SCRIPTS_SKIP_PREFLIGHT_CHECK] = 'true';

  doFileRegistering({
    registerName: 'react-scripts',
    majorVersion: reactScriptsMajorVersion,
    commandPath: reactScriptsCommandPath,
  });
  execNode({
    nodePath,
    args,
    execArgs: [reactScriptsCommandPath, ...args],
  });
};
