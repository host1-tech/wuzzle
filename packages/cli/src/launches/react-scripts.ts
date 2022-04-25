import { logError, logPlain, resolveCommandPath, resolveCommandSemVer } from '@wuzzle/helpers';
import { EK, EXIT_CODE_ERROR } from '../constants';
import {
  applyJestExtraOptions,
  doFileRegistering,
  envGet,
  envSet,
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
  const reactScriptSubCommand = envGet(EK.COMMAND_ARGS)[0];
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

  envSet(EK.TP_SKIP_PREFLIGHT_CHECK, 'true');
  doFileRegistering({
    registerName: 'react-scripts',
    majorVersion: reactScriptsMajorVersion,
    commandPath: reactScriptsCommandPath,
  });
  execNode({
    nodePath,
    execArgs: [reactScriptsCommandPath, ...args],
  });
};
