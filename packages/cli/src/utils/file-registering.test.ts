import { logError, logPlain, resolveRequire } from '@wuzzle/helpers';
import { mocked } from 'ts-jest/utils';
import { EK, EXIT_CODE_ERROR } from '../constants';
import { envSet } from './env-get-set';
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

jest.mock('./env-get-set');

jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});

describe('doFileRegistering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocked(resolveRequire).mockImplementation(id => id);
  });

  it('functions silently if the first attempt succeeds', () => {
    doFileRegistering(options);
    expect(mockedRegisterWebpack5).toBeCalledWith({ commandPath });
    expect(envSet).toBeCalledWith(EK.INTERNAL_PRE_CONFIG, expect.stringContaining('pre-config'));
    expect(logPlain).not.toBeCalled();
  });

  it('functions with warning if the non-first attempt succeeds', () => {
    mocked(mockedRegisterWebpack5).mockImplementationOnce(() => {
      throw 0;
    });
    doFileRegistering(options);
    expect(mockedRegisterWebpack4).toBeCalledWith({ commandPath });
    expect(envSet).toBeCalledWith(EK.INTERNAL_PRE_CONFIG, expect.stringContaining('pre-config'));
    expect(logPlain).toBeCalled();
  });

  it('functions but leaves pre config blank if resolving pre config fails', () => {
    mocked(resolveRequire).mockImplementation(id => {
      if (id.includes('pre-config')) throw 0;
      return id;
    });
    doFileRegistering(options);
    expect(mockedRegisterWebpack5).toBeCalledWith({ commandPath });
    expect(envSet).not.toBeCalled();
    expect(logPlain).not.toBeCalled();
  });

  it('reports error and terminates process if all tries fail by default', () => {
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

  it(`throws error if all tries fail but 'throwErr' specified`, () => {
    mocked(mockedRegisterWebpack5).mockImplementationOnce(() => {
      throw 0;
    });
    mocked(mockedRegisterWebpack4).mockImplementationOnce(() => {
      throw 0;
    });
    expect(() => doFileRegistering({ ...options, throwErr: true })).toThrow(options.registerName);
  });

  it('specifies the maximum number of attemps', () => {
    mocked(mockedRegisterWebpack5).mockImplementationOnce(() => {
      throw 0;
    });
    try {
      doFileRegistering({ ...options, attempts: 1 });
    } catch {}
    expect(mockedRegisterWebpack4).not.toBeCalled();
    expect(logError).toBeCalled();
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
  });
});
