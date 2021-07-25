import { resolveCommandPath, resolveCommandSemVer, resolveRequire } from '@wuzzle/helpers';
import { noop } from 'lodash';
import { mocked } from 'ts-jest/utils';
import { EXIT_CODE_ERROR } from '../constants';
import { areArgsParsableByFlags, execNode, LaunchOptions } from '../utils';
import { launchJest } from './jest';

const commandName = 'commandName';
const launchOptions: LaunchOptions = {
  nodePath: '/path/to/node',
  args: [],
  projectPath: '/path/to/project',
  commandName,
};
const jestRegisterPath = '/path/to/register/jest';

jest.mock('@wuzzle/helpers');
jest.mock('../utils');
jest.spyOn(console, 'error').mockImplementation(noop);
jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});
mocked(resolveCommandSemVer).mockReturnValue({} as never);

describe('launchTest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('executes with jest register attached if command resolvable', () => {
    mocked(resolveRequire).mockReturnValueOnce(jestRegisterPath);
    mocked(areArgsParsableByFlags).mockReturnValueOnce(false);
    launchJest(launchOptions);
    expect(resolveCommandPath).toBeCalled();
    expect(resolveCommandSemVer).toBeCalled();
    expect(resolveRequire).toBeCalled();
    expect(mocked(execNode).mock.calls[0][0].execArgs).toEqual(
      expect.arrayContaining([jestRegisterPath])
    );
  });

  it.each([['--inspect'], ['--inspect=8080'], ['--inspect-brk'], ['--inspect-brk=8080']])(
    'supports %s',
    (...args) => {
      mocked(areArgsParsableByFlags).mockReturnValueOnce(true);
      launchJest({ ...launchOptions, args });
      expect(mocked(execNode).mock.calls[0][0].execArgs).toEqual(
        expect.arrayContaining([...args, '--runInBand'])
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
    const { execArgs } = mocked(execNode).mock.calls[0][0];
    expect(execArgs).toEqual(expect.arrayContaining([inspectBrk, '--runInBand']));
    expect(execArgs).toEqual(expect.not.arrayContaining([inspect]));
  });

  it('executes w/o --runInBand if node args provided but not inspecting', () => {
    mocked(areArgsParsableByFlags).mockReturnValueOnce(true);
    launchJest(launchOptions);
    expect(mocked(execNode).mock.calls[0][0].execArgs).toEqual(
      expect.not.arrayContaining(['--runInBand'])
    );
  });

  it('exits with error code and error message if command not resolvable', () => {
    mocked(resolveCommandPath).mockImplementationOnce(() => {
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
