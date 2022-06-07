import {
  logError,
  logPlain,
  resolveCommandPath,
  resolveCommandSemVer,
  resolveRequire,
  SimpleAsyncCall,
} from '@wuzzle/helpers';
import { EK, EXIT_CODE_ERROR } from '../constants';
import {
  applyJestExtraOptions,
  doFileRegistering,
  envGet,
  envGetDefault,
  envSet,
  execNode,
  LaunchFunction,
  tmplLogForGlobalResolving,
} from '../utils';

export const launchVueCliService: LaunchFunction = async ({
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

  const vueCliServiceSubCommand = envGet(EK.COMMAND_ARGS)[0];
  let vueCliServiceCommandType = envGetDefault(EK.COMMAND_TYPE);
  const optInCalls: SimpleAsyncCall[] = [];

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
      const { applyPreCompilation } = applyJestExtraOptions({
        nodePath,
        name: 'wuzzle-vue-cli-service-test-jest',
        args,
      });
      optInCalls.push(applyPreCompilation);
    }
  }
  if (vueCliServiceSubCommand === 'test:e2e') {
    try {
      resolveRequire('@vue/cli-plugin-e2e-cypress', { basedir: projectPath });
      vueCliServiceCommandType = 'cypress';
    } catch {}
  }

  envSet(EK.COMMAND_TYPE, vueCliServiceCommandType);

  doFileRegistering({
    registerName: 'vue-cli-service',
    majorVersion: vueCliServiceMajorVersion,
    commandPath: vueCliServiceCommandPath,
  });

  for (const call of optInCalls) await call();

  execNode({
    nodePath,
    execArgs: [vueCliServiceCommandPath, ...args],
  });
};
