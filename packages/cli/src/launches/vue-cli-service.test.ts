import { mocked } from 'ts-jest/utils';

import {
  logError,
  resolveCommandPath,
  resolveCommandSemVer,
  resolveRequire,
} from '@wuzzle/helpers';

import { EK, EXIT_CODE_ERROR } from '../constants';
import {
  applyJestExtraOptions,
  doFileRegistering,
  envGet,
  envSet,
  execNode,
  FileRegisteringOptions,
  LaunchOptions,
  tmplLogForGlobalResolving,
} from '../utils';
import { launchVueCliService } from './vue-cli-service';

const commandName = 'commandName';
const commandPath = '/path/to/command';
const launchOptions: LaunchOptions = {
  nodePath: '/path/to/node',
  args: [],
  projectPath: '/path/to/project',
  commandName,
};
const logForGlobalResolving = 'log for global resolving';
const majorVersion = 4;
const fileRegisteringOptions: FileRegisteringOptions = {
  registerName: 'vue-cli-service',
  majorVersion,
  commandPath,
};

const vueCliPluginUnitJestPath = '/path/to/vue-cli-plugin-unit-jest';
const vueCliPluginUnitMochaPath = '/path/to/vue-cli-plugin-unit-mocha';
const vueCliPluginE2eCypressPath = '/path/to/vue-cli-plugin-e2e-cypress';

jest.mock('@wuzzle/helpers');
jest.mock('../utils');
jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});

const applyPreCompilation = jest.fn();
mocked(applyJestExtraOptions).mockReturnValue({ applyPreCompilation });
mocked(envGet).mockReturnValue([]);
mocked(tmplLogForGlobalResolving).mockReturnValue(logForGlobalResolving);
const resolveVueCliPluginUnitJest = jest
  .fn(resolveRequire)
  .mockReturnValue(vueCliPluginUnitJestPath);
const resolveVueCliPluginUnitMocha = jest
  .fn(resolveRequire)
  .mockReturnValue(vueCliPluginUnitMochaPath);
const resolveVueCliPluginE2eCypressPath = jest
  .fn(resolveRequire)
  .mockReturnValue(vueCliPluginE2eCypressPath);
mocked(resolveRequire).mockImplementation(id => {
  if (id === '@vue/cli-plugin-unit-jest') {
    return resolveVueCliPluginUnitJest(id);
  } else if (id === '@vue/cli-plugin-unit-mocha') {
    return resolveVueCliPluginUnitMocha(id);
  } else if (id === '@vue/cli-plugin-e2e-cypress') {
    return resolveVueCliPluginE2eCypressPath(id);
  }
  return id;
});
mocked(resolveCommandPath).mockReturnValue(commandPath);
mocked(resolveCommandSemVer).mockReturnValue({ major: majorVersion } as never);

describe('launchVueCliService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executes with vue-cli-register register attached if command resolved', async () => {
    await launchVueCliService(launchOptions);
    expect(resolveCommandPath).toBeCalled();
    expect(resolveCommandSemVer).toBeCalled();
    expect(doFileRegistering).toBeCalledWith(fileRegisteringOptions);
    expect(execNode).toBeCalledWith(
      expect.objectContaining({
        execArgs: expect.arrayContaining([commandPath]),
      })
    );
  });

  it('resolves vue-cli-service global if command not resolved from locals', async () => {
    mocked(resolveCommandPath).mockImplementationOnce(() => {
      throw 0;
    });
    await launchVueCliService(launchOptions);
    expect(resolveCommandPath).toBeCalled();
    expect(resolveCommandSemVer).toBeCalled();
    expect(doFileRegistering).toBeCalledWith(fileRegisteringOptions);
    expect(execNode).toBeCalledWith(
      expect.objectContaining({
        execArgs: expect.arrayContaining([commandPath]),
      })
    );
  });

  it('sets jest env, prepares its extra options, pre-compiles on test:unit/jest', async () => {
    mocked(envGet).mockReturnValueOnce(['test:unit']);
    resolveVueCliPluginUnitMocha.mockImplementationOnce(() => {
      throw 0;
    });
    await launchVueCliService(launchOptions);
    expect(envSet).toBeCalledWith(EK.COMMAND_TYPE, 'jest');
    expect(applyJestExtraOptions).toBeCalled();
    expect(applyPreCompilation).toBeCalled();
  });

  it('sets mocha env on test:unit/mocha', async () => {
    mocked(envGet).mockReturnValueOnce(['test:unit']);
    resolveVueCliPluginUnitJest.mockImplementationOnce(() => {
      throw 0;
    });
    await launchVueCliService(launchOptions);
    expect(envSet).toBeCalledWith(EK.COMMAND_TYPE, 'mocha');
  });

  it('prepares cypress env on test:e2e/cypress', async () => {
    mocked(envGet).mockReturnValueOnce(['test:e2e']);
    await launchVueCliService(launchOptions);
    expect(envSet).toBeCalledWith(EK.COMMAND_TYPE, 'cypress');
  });

  it('exits with error code and error message if command not resolved', async () => {
    mocked(resolveCommandPath)
      .mockImplementationOnce(() => {
        throw 0;
      })
      .mockImplementationOnce(() => {
        throw 0;
      });
    try {
      await launchVueCliService(launchOptions);
    } catch {}
    expect(logError).toBeCalledWith(expect.stringContaining(commandName));
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
    expect(execNode).not.toBeCalled();
  });
});
