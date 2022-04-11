import { logError, resolveRequire } from '@wuzzle/helpers';
import { times } from 'lodash';
import path from 'path';
import { mocked } from 'ts-jest/utils';
import webpack from 'webpack';
import applyConfig from '../../apply-config';
import { EK_DRY_RUN, EK_PROJECT_PATH, EXIT_CODE_ERROR } from '../../constants';
import { register as registerWebpack4, unregister as unregisterWebpack4 } from '../webpack__4.x';
import { register as registerWebpack5, unregister as unregisterWebpack5 } from '../webpack__5.x';
import { register, unregister } from './transform';

const commandPath = '/path/to/command';
const projectPath = '/path/to/project';
const webpackConfig: webpack.Configuration = {};

jest.mock(
  '@cypress/webpack-preprocessor',
  () => ({
    defaultOptions: { webpackOptions: webpackConfig },
  }),
  { virtual: true }
);
jest.mock('@wuzzle/helpers');
jest.mock('../../apply-config');
jest.mock('../webpack__4.x');
jest.mock('../webpack__5.x');

jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});

describe('register/unregister', () => {
  beforeAll(() => {
    process.env[EK_PROJECT_PATH] = projectPath;
  });

  beforeEach(() => {
    mocked(resolveRequire).mockImplementation(id => id);
    jest.clearAllMocks();
    delete process.env[EK_DRY_RUN];
  });

  it('uses webpack 4 register on registering', () => {
    register({ commandPath });
    expect(resolveRequire).toBeCalledWith('@cypress/webpack-preprocessor', {
      basedir: projectPath,
    });
    expect(registerWebpack4).toBeCalledWith({ commandPath });
  });

  it('uses webpack 5 register on registering if webpack 4 registering fails', () => {
    mocked(registerWebpack4).mockImplementationOnce(() => {
      throw 0;
    });
    register({ commandPath });
    expect(resolveRequire).toBeCalledWith('@cypress/webpack-preprocessor', {
      basedir: projectPath,
    });
    expect(registerWebpack5).toBeCalledWith({ commandPath });
  });

  it('reports error and terminates process if required deps not found', () => {
    mocked(resolveRequire).mockImplementation(id => {
      if (id === '@cypress/webpack-preprocessor') throw 0;
      return id;
    });
    try {
      register({ commandPath });
    } catch {}
    expect(logError).toBeCalledWith(expect.stringContaining('@cypress/webpack-preprocessor'));
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
  });

  it('prints config info and terminates process in dry-run mode', () => {
    process.env[EK_DRY_RUN] = 'true';
    try {
      register({ commandPath });
    } catch {}
    times(2).forEach(i => {
      expect(resolveRequire).toHaveBeenNthCalledWith(i + 1, '@cypress/webpack-preprocessor', {
        basedir: projectPath,
      });
    });
    expect(resolveRequire).toBeCalledWith('webpack', { basedir: path.dirname(commandPath) });
    expect(applyConfig).toBeCalledWith(webpackConfig, webpack);
    expect(process.exit).toBeCalled();
  });

  it('uses webpack 4 unregister on unregistering', () => {
    unregister({ commandPath });
    expect(unregisterWebpack4).toBeCalledWith({ commandPath });
  });

  it('uses webpack 5 unregister on unregistering if webpack 4 unregistering fails', () => {
    mocked(unregisterWebpack4).mockImplementationOnce(() => {
      throw 0;
    });
    unregister({ commandPath });
    expect(unregisterWebpack5).toBeCalledWith({ commandPath });
  });
});
