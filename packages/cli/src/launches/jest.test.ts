import { logError, logPlain, resolveCommandPath, resolveCommandSemVer } from '@wuzzle/helpers';
import { mocked } from 'ts-jest/utils';
import { EK_JEST_EXTRA_OPTIONS, EXIT_CODE_ERROR } from '../constants';
import {
  doFileRegistering,
  execNode,
  FileRegisteringOptions,
  getDefaultJestExtraOptions,
  LaunchOptions,
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
  execNode: jest.fn(),
  tmplLogForGlobalResolving: jest.fn(),
}));
mocked(tmplLogForGlobalResolving).mockReturnValue(logForGlobalResolving);
mocked(resolveCommandPath).mockReturnValue(commandPath);
mocked(resolveCommandSemVer).mockReturnValue({ major: majorVersion } as never);

jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});

describe('launchTest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env[EK_JEST_EXTRA_OPTIONS];
  });

  it('executes with jest register attached if command resolved', () => {
    launchJest(launchOptions);
    expect(resolveCommandPath).toBeCalled();
    expect(resolveCommandSemVer).toBeCalled();
    expect(doFileRegistering).toBeCalledWith(fileRegisteringOptions);
    expect(execNode).toBeCalledWith(
      expect.objectContaining({
        execArgs: expect.arrayContaining([commandPath]),
      })
    );
  });

  it('resolves jest global if command not resolved from locals', () => {
    mocked(resolveCommandPath).mockImplementationOnce(() => {
      throw 0;
    });
    launchJest(launchOptions);
    expect(resolveCommandPath).toBeCalledWith(expect.objectContaining({ fromGlobals: true }));
    expect(logPlain).toBeCalledWith(logForGlobalResolving);
    expect(resolveCommandSemVer).toBeCalled();
    expect(doFileRegistering).toBeCalledWith(fileRegisteringOptions);
    expect(execNode).toBeCalledWith(
      expect.objectContaining({
        execArgs: expect.arrayContaining([commandPath]),
      })
    );
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
      launchJest(launchOptions);
    } catch {}
    expect(logError).toBeCalledWith(expect.stringContaining(commandName));
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
    expect(execNode).not.toBeCalled();
  });

  it.each([['--inspect'], ['--inspect=8080'], ['--inspect-brk'], ['--inspect-brk=8080']])(
    `supports '%s'`,
    (...args) => {
      launchJest({ ...launchOptions, args });
      expect(execNode).toBeCalledWith(
        expect.objectContaining({
          execArgs: expect.arrayContaining([...args, '--runInBand']),
        })
      );
    }
  );

  it.each([
    ['--inspect', '--inspect-brk'],
    ['--inspect=8080', '--inspect-brk'],
    ['--inspect', '--inspect-brk=8088'],
    ['--inspect=8080', '--inspect-brk=8088'],
  ])(`overrides '%s' if '%s' provided`, (inspect, inspectBrk) => {
    launchJest({ ...launchOptions, args: [inspect, inspectBrk] });
    expect(execNode).toBeCalledWith(
      expect.objectContaining({
        execArgs: expect.arrayContaining([inspectBrk, '--runInBand']),
      })
    );
    expect(execNode).toBeCalledWith(
      expect.objectContaining({
        execArgs: expect.not.arrayContaining([inspect]),
      })
    );
  });

  it('executes w/o --runInBand if node args provided but not inspecting', () => {
    launchJest(launchOptions);
    expect(execNode).toBeCalledWith(
      expect.objectContaining({
        execArgs: expect.not.arrayContaining(['--runInBand']),
      })
    );
  });

  it('passes on certian extra options as envs', () => {
    launchJest(launchOptions);
    expect(process.env[EK_JEST_EXTRA_OPTIONS]).toEqual(
      JSON.stringify(getDefaultJestExtraOptions())
    );

    launchJest({ ...launchOptions, args: ['--no-webpack'] });
    expect(process.env[EK_JEST_EXTRA_OPTIONS]).toEqual(
      JSON.stringify({ ...getDefaultJestExtraOptions(), webpack: false })
    );
  });
});
