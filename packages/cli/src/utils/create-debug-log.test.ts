import { createDebugLog } from './create-debug-log';

jest.spyOn(process.stdout, 'write').mockReturnValue(true);

describe('createDebugLog', () => {
  it('writes message to stream', () => {
    const message = 'message';
    const debugLog = createDebugLog(process.stdout);
    debugLog(message);
    expect(process.stdout.write).toBeCalledWith(expect.stringContaining(message));
  });
});
