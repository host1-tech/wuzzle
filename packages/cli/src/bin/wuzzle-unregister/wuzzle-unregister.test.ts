import path from 'path';
import shelljs from 'shelljs';
import { mocked } from 'ts-jest/utils';

import { logError, resolveCommandPath, resolveRequire } from '@wuzzle/helpers';

import { EK, EXIT_CODE_ERROR } from '../../constants';
import { unregister as unregisterJest24 } from '../../registers/jest__24.x';
import { unregister as unregisterJest25 } from '../../registers/jest__25.x';
import { unregister as unregisterJest26 } from '../../registers/jest__26.x';
import { unregister as unregisterWebpack4 } from '../../registers/webpack__4.x';
import { unregister as unregisterWebpack5 } from '../../registers/webpack__5.x';
import { envSet, locateProjectAnchor } from '../../utils';

const fixturePath = path.join(__dirname, 'fixtures');
const originalProcessArgv = process.argv;
const fixedArgs = [process.argv[0], require.resolve('./wuzzle-unregister')];

const extraArgs = ['extraArg'];
const projectPath = fixturePath;

jest.mock('@wuzzle/helpers');
jest.mock('../../utils');
jest.mock('../../registers/jest__24.x', () => ({ unregister: jest.fn() }));
jest.mock('../../registers/jest__25.x', () => ({ unregister: jest.fn() }));
jest.mock('../../registers/webpack__4.x', () => ({ unregister: jest.fn() }));
jest.mock('../../registers/webpack__5.x', () => ({ unregister: jest.fn() }));

mocked(locateProjectAnchor).mockReturnValue(projectPath);
mocked(resolveCommandPath).mockImplementation(({ commandName }) => commandName);
mocked(resolveRequire).mockImplementation(id => id);

jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});

describe('wuzzle-unregister', () => {
  beforeAll(() => {
    shelljs.cd(fixturePath);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.argv = originalProcessArgv;
  });

  it('unregisters by webpack runner if not matched', () => {
    const commandName = 'some-workable-command';
    const commandPath = commandName;
    process.argv = [...fixedArgs, commandName, ...extraArgs];
    jest.isolateModules(() => require('./wuzzle-unregister'));
    expect(locateProjectAnchor).toBeCalled();
    expect(envSet).toBeCalledWith(EK.COMMAND_NAME, 'unregister');
    expect(envSet).toBeCalledWith(EK.COMMAND_ARGS, [commandName, ...extraArgs]);
    expect(resolveCommandPath).toBeCalledWith(
      expect.objectContaining({ cwd: projectPath, commandName })
    );
    expect(unregisterWebpack4).toBeCalledWith(expect.objectContaining({ commandPath }));
    expect(unregisterWebpack5).toBeCalledWith(expect.objectContaining({ commandPath }));
  });

  it('unregisters by special runner if any matched', () => {
    const commandName = 'jest';
    const commandPath = commandName;
    process.argv = [...fixedArgs, commandName, ...extraArgs];
    jest.isolateModules(() => require('./wuzzle-unregister'));
    expect(locateProjectAnchor).toBeCalled();
    expect(envSet).toBeCalledWith(EK.COMMAND_NAME, 'unregister');
    expect(envSet).toBeCalledWith(EK.COMMAND_ARGS, [commandName, ...extraArgs]);
    expect(resolveCommandPath).toBeCalledWith(
      expect.objectContaining({ cwd: projectPath, commandName })
    );
    expect(unregisterJest24).toBeCalledWith(expect.objectContaining({ commandPath }));
    expect(unregisterJest25).toBeCalledWith(expect.objectContaining({ commandPath }));
    expect(unregisterJest26).toBeCalledWith(expect.objectContaining({ commandPath }));
  });

  it('unregisters by webpack runner with storybook resolver', () => {
    const commandName = 'build-storybook';
    const commandPath = expect.stringContaining('@storybook/manager-webpack');
    process.argv = [...fixedArgs, commandName, ...extraArgs];
    jest.isolateModules(() => require('./wuzzle-unregister'));
    expect(locateProjectAnchor).toBeCalled();
    expect(envSet).toBeCalledWith(EK.COMMAND_NAME, 'unregister');
    expect(envSet).toBeCalledWith(EK.COMMAND_ARGS, [commandName, ...extraArgs]);
    expect(resolveCommandPath).toBeCalledWith(
      expect.objectContaining({ cwd: projectPath, commandName })
    );
    expect(unregisterWebpack4).toBeCalledWith(expect.objectContaining({ commandPath }));
    expect(unregisterWebpack5).toBeCalledWith(expect.objectContaining({ commandPath }));
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
