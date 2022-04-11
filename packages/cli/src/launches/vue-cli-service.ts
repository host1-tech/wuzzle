import {
  logError,
  logPlain,
  resolveCommandPath,
  resolveCommandSemVer,
  resolveRequire,
} from '@wuzzle/helpers';
import { EK_COMMAND_ARGS, EK_COMMAND_TYPE, EXIT_CODE_ERROR } from '../constants';
import {
  applyJestExtraOptions,
  doFileRegistering,
  execNode,
  LaunchFunction,
  tmplLogForGlobalResolving,
} from '../utils';

export const launchVueCliService: LaunchFunction = ({
  nodePath,
  args,
  projectPath,
  commandName,
}) => {
  let vueCliServiceCommandPath: string;
  let vueCliServiceMajorVersion: number;
  try {
    try {
      vueCliServiceCommandPath = resolveCommandPath({ cwd: projectPath, commandName });
    } catch {
      vueCliServiceCommandPath = resolveCommandPath({
        cwd: projectPath,
        commandName,
        fromGlobals: true,
      });
      logPlain(tmplLogForGlobalResolving({ commandName, commandPath: vueCliServiceCommandPath }));
    }
    vueCliServiceMajorVersion = resolveCommandSemVer(vueCliServiceCommandPath).major;
  } catch {
    logError(`error: failed to resolve command '${commandName}'.`);
    process.exit(EXIT_CODE_ERROR);
  }

  const vueCliServiceSubCommand = JSON.parse(process.env[EK_COMMAND_ARGS]!)[0];
  let vueCliServiceCommandType: NodeJS.ProcessEnv[string] = 'unknown';
  if (vueCliServiceSubCommand === 'test:unit') {
    try {
      resolveRequire('@vue/cli-plugin-unit-jest', { basedir: projectPath });
      vueCliServiceCommandType = 'jest';
    } catch {}

    try {
      resolveRequire('@vue/cli-plugin-unit-mocha', { basedir: projectPath });
      vueCliServiceCommandType = 'mocha';
    } catch {}

    if (vueCliServiceCommandType === 'jest') {
      applyJestExtraOptions({ nodePath, name: 'wuzzle-vue-cli-service-test-jest', args });
    }
  }
  if (vueCliServiceSubCommand === 'test:e2e') {
    try {
      resolveRequire('@vue/cli-plugin-e2e-cypress', { basedir: projectPath });
      vueCliServiceCommandType = 'cypress';
    } catch {}
  }
  process.env[EK_COMMAND_TYPE] = vueCliServiceCommandType;

  doFileRegistering({
    registerName: 'vue-cli-service',
    majorVersion: vueCliServiceMajorVersion,
    commandPath: vueCliServiceCommandPath,
  });
  execNode({
    nodePath,
    execArgs: [vueCliServiceCommandPath, ...args],
  });
};
