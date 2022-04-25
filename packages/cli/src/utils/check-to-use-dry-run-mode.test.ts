import debugFty from 'debug';
import { mocked } from 'ts-jest/utils';
import { DN_APPLY_CONFIG, EK } from '../constants';
import { checkToUseDryRunMode, dryRunModeCommandOptionName } from './check-to-use-dry-run-mode';
import { envGet, envSet } from './env-get-set';

jest.mock('./env-get-set');

jest.spyOn(debugFty, 'enable');

describe('checkToUseDryRunMode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true and sets up dry run mode if command args matched', () => {
    const args = [dryRunModeCommandOptionName];
    expect(checkToUseDryRunMode(args)).toBe(true);
    expect(args).not.toContain(dryRunModeCommandOptionName);
    expect(envSet).toBeCalledWith(EK.DRY_RUN, 'true');
    expect(envSet).toBeCalledWith(EK.TP_DEBUG, DN_APPLY_CONFIG);
    expect(debugFty.enable).toBeCalledWith(DN_APPLY_CONFIG);
  });

  it('returns false and keeps current mode if command args not matched', () => {
    const extraArg = 'extraArg';
    const args = [extraArg];
    expect(checkToUseDryRunMode(args)).toBe(false);
    expect(args).toContain(extraArg);
    expect(envSet).not.toBeCalled();
    expect(debugFty.enable).not.toBeCalled();
  });

  it('appends debug namespace if other debug namespace presented on command args matched', () => {
    const args = [dryRunModeCommandOptionName];
    const oldDebugEnv = 'd671700';
    const newDebugEnv = `${oldDebugEnv},${DN_APPLY_CONFIG}`;
    mocked(envGet).mockReturnValueOnce(oldDebugEnv);
    expect(checkToUseDryRunMode(args)).toBe(true);
    expect(envSet).toBeCalledWith(EK.TP_DEBUG, newDebugEnv);
    expect(debugFty.enable).toBeCalledWith(newDebugEnv);
  });
});
