import {
  logError,
  logPlain,
  resolveCommandPath,
  resolveCommandSemVer,
  resolveRequire,
} from '@wuzzle/helpers';
import { mocked } from 'ts-jest/utils';
import { EK_INTERNAL_PRE_CONFIG, EK_JEST_EXTRA_OPTIONS, EXIT_CODE_ERROR } from '../constants';
import { register } from '../registers/jest__26.x';
import {
  execNode,
  getDefaultJestExtraOptions,
  LaunchOptions,
  tmplLogForGlobalResolving,
} from '../utils';
import { launchJest } from './jest';

const commandName = 'commandName';
const commandPath = '/path/to/command';
const logForGlobalResolving = 'log for global resolving';
const launchOptions: LaunchOptions = {
  nodePath: '/path/to/node',
  args: [],
  projectPath: '/path/to/project',
  commandName,
};
const jestPreConfigPath = '/path/to/jest/pre-config';

jest.mock('@wuzzle/helpers');
jest.mock('../registers/jest__26.x');
jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  execNode: jest.fn(),
  tmplLogForGlobalResolving: jest.fn(),
}));
jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});
mocked(tmplLogForGlobalResolving).mockReturnValue(logForGlobalResolving);
mocked(resolveCommandPath).mockReturnValue(commandPath);
mocked(resolveCommandSemVer).mockReturnValue({ major: 26 } as never);

describe('launchTest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env[EK_JEST_EXTRA_OPTIONS];
  });

  it('executes with jest register attached and pre config set if command resolved', () => {
    mocked(resolveRequire).mockReturnValueOnce(jestPreConfigPath);
    launchJest(launchOptions);
    expect(resolveCommandPath).toBeCalled();
    expect(resolveCommandSemVer).toBeCalled();
    expect(register).toBeCalledWith({ commandPath });
    expect(execNode).toBeCalledWith(
      expect.objectContaining({
        execArgs: expect.arrayContaining([commandPath]),
      })
    );
    expect(process.env[EK_INTERNAL_PRE_CONFIG]).toBe(jestPreConfigPath);
  });

  it('resolves jest global if command not resolved from locals', () => {
    mocked(resolveCommandPath).mockImplementationOnce(() => {
      throw 0;
    });
    mocked(resolveRequire).mockReturnValueOnce(jestPreConfigPath);
    launchJest(launchOptions);
    expect(resolveCommandPath).toBeCalledWith(expect.objectContaining({ fromGlobals: true }));
    expect(logPlain).toBeCalledWith(logForGlobalResolving);
    expect(resolveCommandSemVer).toBeCalled();
    expect(register).toBeCalledWith({ commandPath });
    expect(execNode).toBeCalledWith(
      expect.objectContaining({
        execArgs: expect.arrayContaining([commandPath]),
      })
    );
    expect(process.env[EK_INTERNAL_PRE_CONFIG]).toBe(jestPreConfigPath);
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
