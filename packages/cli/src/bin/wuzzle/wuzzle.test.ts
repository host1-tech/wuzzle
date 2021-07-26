import { resolveRequire } from '@wuzzle/helpers';
import { noop } from 'lodash';
import path from 'path';
import shelljs from 'shelljs';
import { mocked } from 'ts-jest/utils';
import { EK_COMMAND_NAME, EK_RPOJECT_ANCHOR, EXIT_CODE_ERROR } from '../../constants';
import { launchDefault, launchNode } from '../../launches';

const fixturePath = path.join(__dirname, 'fixtures');
const fixedArgs = [process.argv[0], resolveRequire('./wuzzle')];
const originalProcessArgv = process.argv;

const projectPath = fixturePath;

jest.mock('@wuzzle/helpers');
jest.mock('../../launches');

const mockedWuzzleTranspileExec = jest.fn();
jest.mock('../wuzzle-transpile', () => mockedWuzzleTranspileExec());

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
    delete process.env[EK_COMMAND_NAME];
    delete process.env[EK_RPOJECT_ANCHOR];
    process.argv = originalProcessArgv;
  });

  it('launches default entry in general', () => {
    const commandName = 'webpack';
    process.argv = [...fixedArgs, commandName];
    jest.isolateModules(() => require('./wuzzle'));
    expect(process.env[EK_COMMAND_NAME]).toBe(commandName);
    expect(mocked(launchDefault).mock.calls[0][0]).toMatchObject({ projectPath, commandName });
  });

  it('launches special entry if available', () => {
    const commandName = 'node';
    process.argv = [...fixedArgs, commandName];
    jest.isolateModules(() => require('./wuzzle'));
    expect(process.env[EK_COMMAND_NAME]).toBe(commandName);
    expect(mocked(launchNode).mock.calls[0][0]).toMatchObject({ projectPath, commandName });
  });

  it('redirects to transpile if commanded', () => {
    const commandName = 'transpile';
    const extraArg = 'extraArg';
    process.argv = [...fixedArgs, commandName, extraArg];
    jest.isolateModules(() => require('./wuzzle'));
    expect(process.env[EK_COMMAND_NAME]).toBe(commandName);
    expect(process.argv[1]).toBe(resolveRequire('../wuzzle-transpile'));
    expect(process.argv[2]).toBe(extraArg);
    expect(mockedWuzzleTranspileExec).toBeCalled();
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
    const anchorName = 'In iure tenetur dolorum sit illo qui ullam voluptas autem.';
    process.env[EK_RPOJECT_ANCHOR] = anchorName;
    process.argv = [...fixedArgs];
    try {
      jest.isolateModules(() => require('./wuzzle'));
    } catch {}
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
    expect(console.error).toBeCalledWith(expect.stringContaining(anchorName));
  });
});
