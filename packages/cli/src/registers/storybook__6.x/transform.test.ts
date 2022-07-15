import { mocked } from 'ts-jest/utils';

import { logError, resolveRequire } from '@wuzzle/helpers';

import { EXIT_CODE_ERROR } from '../../constants';
import { register as registerWebpack4, unregister as unregisterWebpack4 } from '../webpack__4.x';
import { register as registerWebpack5, unregister as unregisterWebpack5 } from '../webpack__5.x';
import { register, unregister } from './transform';

const commandPath = '/path/to/command';
jest.mock('../webpack__4.x');
jest.mock('../webpack__5.x');
jest.mock('@wuzzle/helpers');

mocked(resolveRequire).mockImplementation(id => id);

jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});

describe('register/unregister', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses webpack 4 and webpack 5 registers on registering', () => {
    register({ commandPath });
    for (const [storybookManagerWebpackId, registerWebpack] of [
      ['@storybook/manager-webpack4', registerWebpack4],
      ['@storybook/manager-webpack5', registerWebpack5],
    ] as const) {
      expect(resolveRequire).toBeCalledWith(storybookManagerWebpackId, expect.anything());
      expect(registerWebpack).toBeCalledWith({ commandPath: storybookManagerWebpackId });
    }
  });

  it('reports error and terminates process if all registers fail on registering', () => {
    mocked(registerWebpack4).mockImplementationOnce(() => {
      throw 0;
    });
    mocked(registerWebpack5).mockImplementationOnce(() => {
      throw 0;
    });
    try {
      register({ commandPath });
    } catch {}
    expect(logError).toBeCalled();
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
  });

  it('uses webpack 4 and webpack 5 unregisters on unregistering', () => {
    unregister({ commandPath });
    for (const [storybookManagerWebpackId, unregisterWebpack] of [
      ['@storybook/manager-webpack4', unregisterWebpack4],
      ['@storybook/manager-webpack5', unregisterWebpack5],
    ] as const) {
      expect(resolveRequire).toBeCalledWith(storybookManagerWebpackId, expect.anything());
      expect(unregisterWebpack).toBeCalledWith({ commandPath: storybookManagerWebpackId });
    }
  });
});
