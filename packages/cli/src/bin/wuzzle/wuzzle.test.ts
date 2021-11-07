import { resolveRequire } from '@wuzzle/helpers';
import { noop } from 'lodash';
import path from 'path';
import shelljs from 'shelljs';
import {
  EK_COMMAND_ARGS,
  EK_COMMAND_NAME,
  EK_PROJECT_PATH,
  EK_RPOJECT_ANCHOR,
  EXIT_CODE_ERROR,
} from '../../constants';
import { launchDefault, launchJest } from '../../launches';

const fixturePath = path.join(__dirname, 'fixtures');
const fixedArgs = [process.argv[0], resolveRequire('./wuzzle')];
const originalProcessArgv = process.argv;

const extraArgs = ['extraArg'];
const projectPath = fixturePath;

jest.mock('../../launches');

const mockedWuzzleTranspileExec = jest.fn();
jest.mock('../wuzzle-transpile', () => mockedWuzzleTranspileExec());

const mockedWuzzleUnregisterExec = jest.fn();
jest.mock('../wuzzle-unregister', () => mockedWuzzleUnregisterExec());

jest.spyOn(console, 'error').mockImplementation(noop);
jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});

describe('wuzzle', () => {
  beforeAll(() => {
    shelljs.cd(fixturePath);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env[EK_RPOJECT_ANCHOR];
    delete process.env[EK_PROJECT_PATH];
    delete process.env[EK_COMMAND_NAME];
    delete process.env[EK_COMMAND_ARGS];
    delete process.env[EK_RPOJECT_ANCHOR];
    process.argv = originalProcessArgv;
  });

  it('launches default entry in general', () => {
    const commandName = 'some-workable-command';
    process.argv = [...fixedArgs, commandName, ...extraArgs];
    jest.isolateModules(() => require('./wuzzle'));
    expect(process.env[EK_PROJECT_PATH]).toBe(projectPath);
    expect(process.env[EK_COMMAND_NAME]).toBe(commandName);
    expect(process.env[EK_COMMAND_ARGS]).toBe(JSON.stringify(extraArgs));
    expect(launchDefault).toBeCalledWith(
      expect.objectContaining({
        projectPath,
        commandName,
        args: extraArgs,
      })
    );
  });

  it('launches special entry if available', () => {
    const commandName = 'jest';
    process.argv = [...fixedArgs, commandName, ...extraArgs];
    jest.isolateModules(() => require('./wuzzle'));
    expect(process.env[EK_PROJECT_PATH]).toBe(projectPath);
    expect(process.env[EK_COMMAND_NAME]).toBe(commandName);
    expect(process.env[EK_COMMAND_ARGS]).toBe(JSON.stringify(extraArgs));
    expect(launchJest).toBeCalledWith(
      expect.objectContaining({
        projectPath,
        commandName,
        args: extraArgs,
      })
    );
  });

  it('redirects to transpile if commanded', () => {
    const commandName = 'transpile';
    const extraArg = 'extraArg';
    process.argv = [...fixedArgs, commandName, extraArg];
    jest.isolateModules(() => require('./wuzzle'));
    expect(process.env[EK_PROJECT_PATH]).toBe(projectPath);
    expect(process.env[EK_COMMAND_NAME]).toBe(commandName);
    expect(process.env[EK_COMMAND_ARGS]).toBe(JSON.stringify(extraArgs));
    expect(process.argv[1]).toBe(resolveRequire('../wuzzle-transpile'));
    expect(process.argv[2]).toBe(extraArg);
    expect(mockedWuzzleTranspileExec).toBeCalled();
  });

  it('redirects to unregister if commanded', () => {
    const commandName = 'unregister';
    const extraArg = 'extraArg';
    process.argv = [...fixedArgs, commandName, extraArg];
    jest.isolateModules(() => require('./wuzzle'));
    expect(process.env[EK_PROJECT_PATH]).toBe(projectPath);
    expect(process.env[EK_COMMAND_NAME]).toBe(commandName);
    expect(process.env[EK_COMMAND_ARGS]).toBe(JSON.stringify(extraArgs));
    expect(process.argv[1]).toBe(resolveRequire('../wuzzle-unregister'));
    expect(process.argv[2]).toBe(extraArg);
    expect(mockedWuzzleUnregisterExec).toBeCalled();
  });

  it('reports error if command not specified', () => {
    process.argv = [...fixedArgs];
    try {
      jest.isolateModules(() => require('./wuzzle'));
    } catch {}
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
    expect(console.error).toBeCalledWith(expect.stringContaining('error:'));
  });

  it('reports error if anchor not located', () => {
    const anchorName = 'a4b7e86983e611193697d967fe6ae27fa43e5353';
    process.env[EK_RPOJECT_ANCHOR] = anchorName;
    process.argv = [...fixedArgs];
    try {
      jest.isolateModules(() => require('./wuzzle'));
    } catch {}
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
    expect(console.error).toBeCalledWith(expect.stringContaining(anchorName));
  });
});
