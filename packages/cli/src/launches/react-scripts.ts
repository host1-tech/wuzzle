import { resolveCommandPath, resolveCommandSemVer, resolveRequire } from '@wuzzle/helpers';
import {
  EK_INTERNAL_PRE_CONFIG,
  EK_REACT_SCRIPTS_SKIP_PREFLIGHT_CHECK,
  EXIT_CODE_ERROR,
} from '../constants';
import { execNode, LaunchFunction, tmplLogForGlobalResolving } from '../utils';

export const launchReactScripts: LaunchFunction = ({
  nodePath,
  args,
  projectPath,
  commandName,
}) => {
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
      console.log(tmplLogForGlobalResolving({ commandName, commandPath: reactScriptsCommandPath }));
    }
    reactScriptsMajorVersion = resolveCommandSemVer(reactScriptsCommandPath).major;
  } catch {
    console.error(`error: failed to resolve command '${commandName}'.`);
    process.exit(EXIT_CODE_ERROR);
  }

  process.env[EK_REACT_SCRIPTS_SKIP_PREFLIGHT_CHECK] = 'true';
  process.env[EK_INTERNAL_PRE_CONFIG] = resolveRequire(
    `../registers/react-scripts__${reactScriptsMajorVersion}.x/pre-config`
  );
  require(`../registers/react-scripts__${reactScriptsMajorVersion}.x`).register({
    commandPath: reactScriptsCommandPath,
  });

  execNode({
    nodePath,
    args,
    execArgs: [reactScriptsCommandPath, ...args],
  });
};
