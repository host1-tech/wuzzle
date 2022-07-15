import path from 'path';
import shelljs from 'shelljs';
import { mocked } from 'ts-jest/utils';

import { logError, resolveCommandPath } from '@wuzzle/helpers';

import { EK, EXIT_CODE_ERROR } from '../../constants';
import { unregister as unregisterJest24 } from '../../registers/jest__24.x';
import { unregister as unregisterJest25 } from '../../registers/jest__25.x';
import { unregister as unregisterJest26 } from '../../registers/jest__26.x';
import { unregister as unregisterStorybook6 } from '../../registers/storybook__6.x';
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
jest.mock('../../registers/storybook__6.x', () => ({ unregister: jest.fn() }));
jest.mock('../../registers/webpack__4.x', () => ({ unregister: jest.fn() }));
jest.mock('../../registers/webpack__5.x', () => ({ unregister: jest.fn() }));

mocked(locateProjectAnchor).mockReturnValue(projectPath);
mocked(resolveCommandPath).mockImplementation(({ commandName }) => commandName);

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

  it('unregisters webpack if not matched', () => {
    const commandName = 'some-workable-command';
    process.argv = [...fixedArgs, commandName, ...extraArgs];
    jest.isolateModules(() => require('./wuzzle-unregister'));
    expect(locateProjectAnchor).toBeCalled();
    expect(envSet).toBeCalledWith(EK.COMMAND_NAME, 'unregister');
    expect(envSet).toBeCalledWith(EK.COMMAND_ARGS, [commandName, ...extraArgs]);
    expect(resolveCommandPath).toBeCalledWith(
      expect.objectContaining({ cwd: projectPath, commandName })
    );
    expect(unregisterWebpack4).toBeCalledWith(
      expect.objectContaining({ commandPath: commandName })
    );
    expect(unregisterWebpack5).toBeCalledWith(
      expect.objectContaining({ commandPath: commandName })
    );
  });

  it('unregisters command-named module if any matched except storybook', () => {
    const commandName = 'jest';
    process.argv = [...fixedArgs, commandName, ...extraArgs];
    jest.isolateModules(() => require('./wuzzle-unregister'));
    expect(locateProjectAnchor).toBeCalled();
    expect(envSet).toBeCalledWith(EK.COMMAND_NAME, 'unregister');
    expect(envSet).toBeCalledWith(EK.COMMAND_ARGS, [commandName, ...extraArgs]);
    expect(resolveCommandPath).toBeCalledWith(
      expect.objectContaining({ cwd: projectPath, commandName })
    );
    expect(unregisterJest24).toBeCalledWith(expect.objectContaining({ commandPath: commandName }));
    expect(unregisterJest25).toBeCalledWith(expect.objectContaining({ commandPath: commandName }));
    expect(unregisterJest26).toBeCalledWith(expect.objectContaining({ commandPath: commandName }));
  });

  it('unregisters storybook if storybook matched', () => {
    const commandName = 'start-storybook';
    process.argv = [...fixedArgs, commandName, ...extraArgs];
    jest.isolateModules(() => require('./wuzzle-unregister'));
    expect(locateProjectAnchor).toBeCalled();
    expect(envSet).toBeCalledWith(EK.COMMAND_NAME, 'unregister');
    expect(envSet).toBeCalledWith(EK.COMMAND_ARGS, [commandName, ...extraArgs]);
    expect(resolveCommandPath).toBeCalledWith(
      expect.objectContaining({ cwd: projectPath, commandName })
    );
    expect(unregisterStorybook6).toBeCalledWith(
      expect.objectContaining({ commandPath: commandName })
    );
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
