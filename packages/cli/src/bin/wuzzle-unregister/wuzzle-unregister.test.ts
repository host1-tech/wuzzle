import { resolveCommandPath, resolveRequire } from '@wuzzle/helpers';
import { noop } from 'lodash';
import {
  EK_COMMAND_ARGS,
  EK_COMMAND_NAME,
  EK_RPOJECT_ANCHOR,
  EXIT_CODE_ERROR,
} from '../../constants';
import { unregister as unregisterJest24 } from '../../registers/jest__24.x';
import { unregister as unregisterJest25 } from '../../registers/jest__25.x';
import { unregister as unregisterJest26 } from '../../registers/jest__26.x';
import { unregister as unregisterWebpack4 } from '../../registers/webpack__4.x';
import { unregister as unregisterWebpack5 } from '../../registers/webpack__5.x';

const originalProcessArgv = process.argv;
const fixedArgs = [process.argv[0], resolveRequire('./wuzzle-unregister')];
const extraArgs = ['extraArg'];

jest.mock('../../registers/jest__24.x');
jest.mock('../../registers/jest__25.x');
jest.mock('../../registers/jest__26.x');
jest.mock('../../registers/webpack__4.x');
jest.mock('../../registers/webpack__5.x');

jest.mock('@wuzzle/helpers', () => ({
  ...jest.requireActual('@wuzzle/helpers'),
  resolveCommandPath: jest.fn(),
}));

jest.spyOn(console, 'error').mockImplementation(noop);
jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});

describe('wuzzle-unregister', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env[EK_COMMAND_NAME];
    delete process.env[EK_COMMAND_ARGS];
    delete process.env[EK_RPOJECT_ANCHOR];
    process.argv = originalProcessArgv;
  });

  it('unregisters webpack by default', () => {
    const commandName = 'some-workable-command';
    process.argv = [...fixedArgs, commandName, ...extraArgs];
    jest.isolateModules(() => require('./wuzzle-unregister'));
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
    expect(console.error).toBeCalledWith(expect.stringContaining('error:'));
  });

  it('reports error if anchor not located', () => {
    const anchorName = '2ba21b46fa08d8b1ba2ad308631e234d277f1f61';
    process.env[EK_RPOJECT_ANCHOR] = anchorName;
    process.argv = [...fixedArgs];
    try {
      jest.isolateModules(() => require('./wuzzle-unregister'));
    } catch {}
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
    expect(console.error).toBeCalledWith(expect.stringContaining(anchorName));
  });
});
