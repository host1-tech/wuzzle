import { logError, logPlain, resolveRequire } from '@wuzzle/helpers';
import { mocked } from 'ts-jest/utils';
import { EK_INTERNAL_PRE_CONFIG, EXIT_CODE_ERROR } from '../constants';
import { doFileRegistering, FileRegisteringOptions } from './file-registering';

const commandPath = '/path/to/command';
const options: FileRegisteringOptions = {
  registerName: 'webpack',
  majorVersion: 5,
  commandPath,
};

jest.mock('@wuzzle/helpers');

jest.mock('../registers/webpack__4.x', () => ({ register: jest.fn() }), { virtual: true });
const mockedRegisterWebpack4 = require('../registers/webpack__4.x').register;

jest.mock('../registers/webpack__5.x', () => ({ register: jest.fn() }), { virtual: true });
const mockedRegisterWebpack5 = require('../registers/webpack__5.x').register;

jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});

describe('doFileRegistering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocked(resolveRequire).mockImplementation(id => id);
    delete process.env[EK_INTERNAL_PRE_CONFIG];
  });

  it('functions silently if the first try succeeds', () => {
    doFileRegistering(options);
    expect(mockedRegisterWebpack5).toBeCalledWith({ commandPath });
    expect(process.env[EK_INTERNAL_PRE_CONFIG]).toContain('pre-config');
    expect(logPlain).not.toBeCalled();
  });

  it('functions with warning if the second try succeeds', () => {
    mocked(mockedRegisterWebpack5).mockImplementationOnce(() => {
      throw 0;
    });
    doFileRegistering(options);
    expect(mockedRegisterWebpack4).toBeCalledWith({ commandPath });
    expect(process.env[EK_INTERNAL_PRE_CONFIG]).toContain('pre-config');
    expect(logPlain).toBeCalled();
  });

  it('functions but leaves pre config blank if resolving pre config fails', () => {
    mocked(resolveRequire).mockImplementation(id => {
      if (id.includes('pre-config')) throw 0;
      return id;
    });
    doFileRegistering(options);
    expect(mockedRegisterWebpack5).toBeCalledWith({ commandPath });
    expect(process.env[EK_INTERNAL_PRE_CONFIG]).toBeUndefined();
    expect(logPlain).not.toBeCalled();
  });

  it('reports error and terminates process all tries fail', () => {
    mocked(mockedRegisterWebpack5).mockImplementationOnce(() => {
      throw 0;
    });
    mocked(mockedRegisterWebpack4).mockImplementationOnce(() => {
      throw 0;
    });
    try {
      doFileRegistering(options);
    } catch {}
    expect(logError).toBeCalled();
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
  });
});
