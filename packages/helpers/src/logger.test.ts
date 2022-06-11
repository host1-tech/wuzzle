import { noop } from 'lodash';

import { logError, logPlain } from './logger';

jest.spyOn(console, 'error').mockImplementation(noop);
jest.spyOn(console, 'log').mockImplementation(noop);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('logError', () => {
  it('works with error object', () => {
    const e = new Error('message');
    logError(e);
    expect(console.error).toBeCalledWith(e.stack);
  });

  it('works with plain string', () => {
    const s = 'message';
    logError(s);
    expect(console.error).toBeCalledWith(s);
  });
});

describe('logPlain', () => {
  it('works', () => {
    const s = 'message';
    logPlain(s);
    expect(console.log).toBeCalledWith(s);
  });
});
