import { logError, resolveCommandPath, resolveRequire } from '@wuzzle/helpers';
import path from 'path';
import shelljs from 'shelljs';
import { mocked } from 'ts-jest/utils';
import { EK_COMMAND_ARGS, EK_COMMAND_NAME, EXIT_CODE_ERROR } from '../../constants';
import { unregister as unregisterJest24 } from '../../registers/jest__24.x';
import { unregister as unregisterJest25 } from '../../registers/jest__25.x';
import { unregister as unregisterJest26 } from '../../registers/jest__26.x';
import { unregister as unregisterWebpack4 } from '../../registers/webpack__4.x';
import { unregister as unregisterWebpack5 } from '../../registers/webpack__5.x';
import { locateProjectAnchor } from '../../utils';

const fixturePath = path.join(__dirname, 'fixtures');
const originalProcessArgv = process.argv;
const fixedArgs = [process.argv[0], resolveRequire('./wuzzle-unregister')];

const extraArgs = ['extraArg'];
const projectPath = fixturePath;

jest.mock('../../utils');
mocked(locateProjectAnchor).mockReturnValue(projectPath);

jest.mock('../../registers/jest__24.x', () => ({ unregister: jest.fn() }));
jest.mock('../../registers/jest__25.x', () => ({ unregister: jest.fn() }));
jest.mock('../../registers/webpack__4.x', () => ({ unregister: jest.fn() }));
jest.mock('../../registers/webpack__5.x', () => ({ unregister: jest.fn() }));

jest.mock('@wuzzle/helpers', () => ({
  ...jest.requireActual('@wuzzle/helpers'),
  logError: jest.fn(),
  logPlain: jest.fn(),
  resolveCommandPath: jest.fn(),
}));

jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});

describe('wuzzle-unregister', () => {
  beforeAll(() => {
    shelljs.cd(fixturePath);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env[EK_COMMAND_NAME];
    delete process.env[EK_COMMAND_ARGS];
    process.argv = originalProcessArgv;
  });

  it('unregisters webpack by default', () => {
    const commandName = 'some-workable-command';
    process.argv = [...fixedArgs, commandName, ...extraArgs];
    jest.isolateModules(() => require('./wuzzle-unregister'));
    expect(locateProjectAnchor).toBeCalled();
    expect(process.env[EK_COMMAND_NAME]).toBe('unregister');
    expect(process.env[EK_COMMAND_ARGS]).toBe(JSON.stringify([commandName, ...extraArgs]));
    expect(resolveCommandPath).toBeCalledWith(expect.objectContaining({ commandName }));
    expect(unregisterWebpack4).toBeCalled();
    expect(unregisterWebpack5).toBeCalled();
  });

  it('unregisters special module if matched', () => {
    const commandName = 'jest';
    process.argv = [...fixedArgs, commandName, ...extraArgs];
    jest.isolateModules(() => require('./wuzzle-unregister'));
    expect(locateProjectAnchor).toBeCalled();
    expect(process.env[EK_COMMAND_NAME]).toBe('unregister');
    expect(process.env[EK_COMMAND_ARGS]).toBe(JSON.stringify([commandName, ...extraArgs]));
    expect(resolveCommandPath).toBeCalledWith(expect.objectContaining({ commandName }));
    expect(unregisterJest24).toBeCalled();
    expect(unregisterJest25).toBeCalled();
    expect(unregisterJest26).toBeCalled();
  });

  it('reports error if command not specified', () => {
    process.argv = [...fixedArgs];
    try {
      jest.isolateModules(() => require('./wuzzle-unregister'));
    } catch {}
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
    expect(logError).toBeCalledWith(expect.stringContaining('error:'));
  });
});
