import {
  logError,
  logPlain,
  resolveCommandPath,
  resolveCommandSemVer,
  resolveRequire,
} from '@wuzzle/helpers';
import {
  EK_COMMAND_ARGS,
  EK_COMMAND_TYPE,
  EK_INTERNAL_PRE_CONFIG,
  EXIT_CODE_ERROR,
} from '../constants';
import {
  applyJestExtraOptions,
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
  if (vueCliServiceSubCommand === 'test:unit') {
    let vueCliServiceCommandType: NodeJS.ProcessEnv[string];

    try {
      resolveRequire('@vue/cli-plugin-unit-jest', { basedir: projectPath });
      vueCliServiceCommandType = 'jest';
    } catch {}

    try {
      resolveRequire('@vue/cli-plugin-unit-mocha', { basedir: projectPath });
      vueCliServiceCommandType = 'mocha';
    } catch {}

    process.env[EK_COMMAND_TYPE] = vueCliServiceCommandType;

    if (vueCliServiceCommandType === 'jest') {
      applyJestExtraOptions({ nodePath, name: 'wuzzle-vue-cli-service-test-jest', args });
    }
  }

  process.env[EK_INTERNAL_PRE_CONFIG] = resolveRequire(
    `../registers/vue-cli-service__${vueCliServiceMajorVersion}.x/pre-config`
  );

  require(`../registers/vue-cli-service__${vueCliServiceMajorVersion}.x`).register({
    commandPath: vueCliServiceCommandPath,
  });

  execNode({
    nodePath,
    args,
    execArgs: [vueCliServiceCommandPath, ...args],
  });
};
