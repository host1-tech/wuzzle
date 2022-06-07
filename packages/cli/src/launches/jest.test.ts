import { logError, logPlain, resolveCommandPath, resolveCommandSemVer } from '@wuzzle/helpers';
import { mocked } from 'ts-jest/utils';
import { EK, EXIT_CODE_ERROR } from '../constants';
import {
  doFileRegistering,
  envGet,
  envGetDefault,
  envSet,
  execNode,
  FileRegisteringOptions,
  LaunchOptions,
  preCompile,
  setPreCompileOptionsByCommandProg,
  tmplLogForGlobalResolving,
} from '../utils';
import { launchJest } from './jest';

const commandName = 'commandName';
const commandPath = '/path/to/command';
const launchOptions: LaunchOptions = {
  nodePath: '/path/to/node',
  args: [],
  projectPath: '/path/to/project',
  commandName,
};
const logForGlobalResolving = 'log for global resolving';
const majorVersion = 26;
const fileRegisteringOptions: FileRegisteringOptions = {
  registerName: 'jest',
  majorVersion,
  commandPath,
};

jest.mock('@wuzzle/helpers');

jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  doFileRegistering: jest.fn(),
  envGet: jest.fn(),
  envSet: jest.fn(),
  execNode: jest.fn(),
  getDefaultPreCompileOptions: jest.fn(),
  preCompile: jest.fn(),
  setPreCompileOptionsByCommandProg: jest.fn(),
  tmplLogForGlobalResolving: jest.fn(),
}));
mocked(envGet).mockReturnValue('test');
mocked(resolveCommandPath).mockReturnValue(commandPath);
mocked(resolveCommandSemVer).mockReturnValue({ major: majorVersion } as never);
mocked(tmplLogForGlobalResolving).mockReturnValue(logForGlobalResolving);

jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});

describe('launchTest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executes with register attached and pre-compilation if command resolved', async () => {
    await launchJest(launchOptions);
    expect(resolveCommandPath).toBeCalled();
    expect(resolveCommandSemVer).toBeCalled();
    expect(doFileRegistering).toBeCalledWith(fileRegisteringOptions);
    expect(preCompile).toBeCalled();
    expect(execNode).toBeCalledWith(
      expect.objectContaining({ execArgs: expect.arrayContaining([commandPath]) })
    );
  });

  it('resolves jest global if command not resolved from locals', async () => {
    mocked(resolveCommandPath).mockImplementationOnce(() => {
      throw 0;
    });
    await launchJest(launchOptions);
    expect(resolveCommandPath).toBeCalledWith(expect.objectContaining({ fromGlobals: true }));
    expect(logPlain).toBeCalledWith(logForGlobalResolving);
    expect(resolveCommandSemVer).toBeCalled();
    expect(doFileRegistering).toBeCalledWith(fileRegisteringOptions);
    expect(preCompile).toBeCalled();
    expect(execNode).toBeCalledWith(
      expect.objectContaining({ execArgs: expect.arrayContaining([commandPath]) })
    );
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
      await launchJest(launchOptions);
    } catch {}
    expect(logError).toBeCalledWith(expect.stringContaining(commandName));
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
    expect(execNode).not.toBeCalled();
  });

  it.each([['--inspect'], ['--inspect=8080'], ['--inspect-brk'], ['--inspect-brk=8080']])(
    `supports '%s'`,
    async (...args) => {
      await launchJest({ ...launchOptions, args });
      expect(execNode).toBeCalledWith(
        expect.objectContaining({ execArgs: expect.arrayContaining([...args, '--runInBand']) })
      );
    }
  );

  it.each([
    ['--inspect', '--inspect-brk'],
    ['--inspect=8080', '--inspect-brk'],
    ['--inspect', '--inspect-brk=8088'],
    ['--inspect=8080', '--inspect-brk=8088'],
  ])(`overrides '%s' if '%s' provided`, async (inspect, inspectBrk) => {
    await launchJest({ ...launchOptions, args: [inspect, inspectBrk] });
    expect(execNode).toBeCalledWith(
      expect.objectContaining({ execArgs: expect.arrayContaining([inspectBrk, '--runInBand']) })
    );
    expect(execNode).toBeCalledWith(
      expect.objectContaining({
        execArgs: expect.not.arrayContaining([inspect]),
      })
    );
  });

  it('executes w/o --runInBand if node args provided but not inspecting', async () => {
    await launchJest(launchOptions);
    expect(execNode).toBeCalledWith(
      expect.objectContaining({ execArgs: expect.not.arrayContaining(['--runInBand']) })
    );
  });

  it('uses the other options if matched', async () => {
    await launchJest({ ...launchOptions, args: ['--no-webpack'] });
    expect(envSet).toBeCalledWith(
      EK.JEST_EXTRA_OPTIONS,
      expect.objectContaining({ webpack: false })
    );
    expect(setPreCompileOptionsByCommandProg).not.toBeCalled();

    await launchJest({ ...launchOptions, args: ['--pre-compile', '*.js'] });
    expect(envSet).toBeCalledWith(EK.JEST_EXTRA_OPTIONS, envGetDefault(EK.JEST_EXTRA_OPTIONS));
    expect(setPreCompileOptionsByCommandProg).toBeCalled();
  });

  it('sets NODE_ENV if absent', async () => {
    mocked(envGet).mockReturnValueOnce(undefined);
    await launchJest(launchOptions);
    expect(envSet).toBeCalledWith('NODE_ENV', 'test');
  });
});
