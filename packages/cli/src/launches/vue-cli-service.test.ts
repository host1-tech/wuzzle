import {
  logError,
  resolveCommandPath,
  resolveCommandSemVer,
  resolveRequire,
} from '@wuzzle/helpers';
import { mocked } from 'ts-jest/utils';
import {
  EK_COMMAND_ARGS,
  EK_COMMAND_TYPE,
  EK_INTERNAL_PRE_CONFIG,
  EXIT_CODE_ERROR,
} from '../constants';
import {
  applyJestExtraOptions,
  doFileRegistering,
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

jest.mock('@wuzzle/helpers');
jest.mock('../utils');
jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});

const resolveVueCliPluginUnitJest = jest
  .fn(resolveRequire)
  .mockReturnValue(vueCliPluginUnitJestPath);
const resolveVueCliPluginUnitMocha = jest
  .fn(resolveRequire)
  .mockReturnValue(vueCliPluginUnitMochaPath);
mocked(resolveRequire).mockImplementation(id => {
  if (id === '@vue/cli-plugin-unit-jest') {
    return resolveVueCliPluginUnitJest(id);
  } else if (id === '@vue/cli-plugin-unit-mocha') {
    return resolveVueCliPluginUnitMocha(id);
  }
  return id;
});
mocked(tmplLogForGlobalResolving).mockReturnValue(logForGlobalResolving);
mocked(resolveCommandPath).mockReturnValue(commandPath);
mocked(resolveCommandSemVer).mockReturnValue({ major: majorVersion } as never);

describe('launchVueCliService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env[EK_COMMAND_ARGS] = '[]';
    delete process.env[EK_INTERNAL_PRE_CONFIG];
  });

  it('executes with vue-cli-register register attached if command resolved', () => {
    launchVueCliService(launchOptions);
    expect(resolveCommandPath).toBeCalled();
    expect(resolveCommandSemVer).toBeCalled();
    expect(doFileRegistering).toBeCalledWith(fileRegisteringOptions);
    expect(execNode).toBeCalledWith(
      expect.objectContaining({
        execArgs: expect.arrayContaining([commandPath]),
      })
    );
  });

  it('resolves vue-cli-service global if command not resolved from locals', () => {
    mocked(resolveCommandPath).mockImplementationOnce(() => {
      throw 0;
    });
    launchVueCliService(launchOptions);
    expect(resolveCommandPath).toBeCalled();
    expect(resolveCommandSemVer).toBeCalled();
    expect(doFileRegistering).toBeCalledWith(fileRegisteringOptions);
    expect(execNode).toBeCalledWith(
      expect.objectContaining({
        execArgs: expect.arrayContaining([commandPath]),
      })
    );
  });

  it('prepares jest env and its extra options on test:unit/jest', () => {
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['test:unit']);
    resolveVueCliPluginUnitMocha.mockImplementationOnce(() => {
      throw 0;
    });
    launchVueCliService(launchOptions);
    expect(process.env[EK_COMMAND_TYPE]).toBe('jest');
    expect(applyJestExtraOptions).toBeCalled();
  });

  it('prepares jest env and its extra options on test:unit/jest', () => {
    process.env[EK_COMMAND_ARGS] = JSON.stringify(['test:unit']);
    resolveVueCliPluginUnitJest.mockImplementationOnce(() => {
      throw 0;
    });
    launchVueCliService(launchOptions);
    expect(process.env[EK_COMMAND_TYPE]).toBe('mocha');
  });

  it('exits with error code and error message if command not resolved', () => {
    mocked(resolveCommandPath)
      .mockImplementationOnce(() => {
        throw 0;
      })
      .mockImplementationOnce(() => {
        throw 0;
      });
    try {
      launchVueCliService(launchOptions);
    } catch {}
    expect(logError).toBeCalledWith(expect.stringContaining(commandName));
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
    expect(execNode).not.toBeCalled();
  });
});
