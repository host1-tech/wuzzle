import { resolveCommandPath, resolveCommandSemVer, resolveRequire } from '@wuzzle/helpers';
import {
  EK_INTERNAL_PRE_CONFIG,
  EK_REACT_SCRIPTS_SKIP_PREFLIGHT_CHECK,
  EXIT_CODE_ERROR,
} from '../constants';
import { execNode, LaunchFunction } from '../utils';

export const launchReactScripts: LaunchFunction = ({
  nodePath,
  args,
  projectPath,
  commandName,
}) => {
  let reactScriptsCommandPath: string;
  let reactScriptsMajorVersion: number;
  try {
    reactScriptsCommandPath = resolveCommandPath({ cwd: projectPath, commandName });
    reactScriptsMajorVersion = resolveCommandSemVer(reactScriptsCommandPath).major;
  } catch {
    console.error(`error: failed to resolve command '${commandName}'.`);
    process.exit(EXIT_CODE_ERROR);
  }

  const reactScriptsRegisterPath = resolveRequire(
    `../registers/react-scripts__${reactScriptsMajorVersion}.x`
  );
  process.env[EK_REACT_SCRIPTS_SKIP_PREFLIGHT_CHECK] = 'true';
  process.env[EK_INTERNAL_PRE_CONFIG] = resolveRequire(
    `../registers/react-scripts__${reactScriptsMajorVersion}.x/pre-config`
  );

  execNode({
    nodePath,
    args,
    execArgs: ['-r', reactScriptsRegisterPath, reactScriptsCommandPath, ...args],
  });
};
