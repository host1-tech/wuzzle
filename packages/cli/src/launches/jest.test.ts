import { resolveCommandPath, resolveCommandSemVer } from '@wuzzle/helpers';
import { noop } from 'lodash';
import { mocked } from 'ts-jest/utils';
import { EXIT_CODE_ERROR } from '../constants';
import { register } from '../registers/jest__26.x';
import {
  areArgsParsableByFlags,
  execNode,
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

jest.mock('@wuzzle/helpers');
jest.mock('../registers/jest__26.x');
jest.mock('../utils');
jest.spyOn(console, 'log').mockImplementation(noop);
jest.spyOn(console, 'error').mockImplementation(noop);
jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});
mocked(tmplLogForGlobalResolving).mockReturnValue(logForGlobalResolving);
mocked(resolveCommandPath).mockReturnValue(commandPath);
mocked(resolveCommandSemVer).mockReturnValue({ major: 26 } as never);

describe('launchTest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executes with jest register attached if command resolved', () => {
    mocked(areArgsParsableByFlags).mockReturnValueOnce(false);
    launchJest(launchOptions);
    expect(resolveCommandPath).toBeCalled();
    expect(resolveCommandSemVer).toBeCalled();
    expect(register).toBeCalledWith({ commandPath });
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
    mocked(areArgsParsableByFlags).mockReturnValueOnce(false);
    launchJest(launchOptions);
    expect(resolveCommandPath).toBeCalledWith(expect.objectContaining({ fromGlobals: true }));
    expect(console.log).toBeCalledWith(logForGlobalResolving);
    expect(resolveCommandSemVer).toBeCalled();
    expect(register).toBeCalledWith({ commandPath });
    expect(execNode).toBeCalledWith(
      expect.objectContaining({
        execArgs: expect.arrayContaining([commandPath]),
      })
    );
  });

  it.each([['--inspect'], ['--inspect=8080'], ['--inspect-brk'], ['--inspect-brk=8080']])(
    'supports %s',
    (...args) => {
      mocked(areArgsParsableByFlags).mockReturnValueOnce(true);
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
  ])('overrides %s if %s provided', (inspect, inspectBrk) => {
    mocked(areArgsParsableByFlags).mockReturnValueOnce(true);
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
    mocked(areArgsParsableByFlags).mockReturnValueOnce(true);
    launchJest(launchOptions);
    expect(execNode).toBeCalledWith(
      expect.objectContaining({
        execArgs: expect.not.arrayContaining(['--runInBand']),
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
    mocked(areArgsParsableByFlags).mockReturnValueOnce(false);
    try {
      launchJest(launchOptions);
    } catch {}
    expect(console.error).toBeCalledWith(expect.stringContaining(commandName));
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
    expect(execNode).not.toBeCalled();
  });
});
