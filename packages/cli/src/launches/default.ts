import { resolveCommandPath, resolveRequire, resolveWebpackSemVer } from '@wuzzle/helpers';
import { EXIT_CODE_ERROR } from '../constants';
import { execNode, LaunchFunction } from '../utils';

export const launchDefault: LaunchFunction = ({ nodePath, args, projectPath, commandName }) => {
  let defaultCommandPath: string;
  let webpackMajorVersion: number;
  try {
    defaultCommandPath = resolveCommandPath({ cwd: projectPath, commandName });
    webpackMajorVersion = resolveWebpackSemVer(defaultCommandPath).major;
  } catch {
    console.error(`error: command '${commandName}' not supported.`);
    process.exit(EXIT_CODE_ERROR);
  }

  const webpackRegisterPath = resolveRequire(`../registers/webpack__${webpackMajorVersion}.x`);

  execNode({
    nodePath,
    args,
    execArgs: ['-r', webpackRegisterPath, defaultCommandPath, ...args],
  });
};