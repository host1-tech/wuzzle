import debugFty from 'debug';
import { DN_APPLY_CONFIG, EK_DEBUG, EK_DRY_RUN } from '../constants';
import { checkToUseDryRunMode, dryRunModeCommandOptionName } from './check-to-use-dry-run-mode';

jest.spyOn(debugFty, 'enable');

describe('checkToUseDryRunMode', () => {
  beforeEach(() => {
    delete process.env[EK_DRY_RUN];
    delete process.env[EK_DEBUG];
    jest.clearAllMocks();
  });

  it('returns true and sets up dry run mode if command args matched', () => {
    const args = [dryRunModeCommandOptionName];
    expect(checkToUseDryRunMode(args)).toBe(true);
    expect(args).not.toContain(dryRunModeCommandOptionName);
    expect(process.env[EK_DRY_RUN]).toBeTruthy();
    expect(process.env[EK_DEBUG]).toBe(DN_APPLY_CONFIG);
    expect(debugFty.enable).toBeCalledWith(DN_APPLY_CONFIG);
  });

  it('returns false and keeps current mode if command args not matched', () => {
    const extraArg = 'extraArg';
    const args = [extraArg];
    expect(checkToUseDryRunMode(args)).toBe(false);
    expect(args).toContain(extraArg);
    expect(process.env[EK_DRY_RUN]).toBeFalsy();
    expect(process.env[EK_DEBUG]).not.toBe(DN_APPLY_CONFIG);
    expect(debugFty.enable).not.toBeCalled();
  });

  it('appends debug namespace if other debug namespace presented on command args matched', () => {
    const args = [dryRunModeCommandOptionName];
    const oldDebugEnv = 'd671700';
    const newDebugEnv = `${oldDebugEnv},${DN_APPLY_CONFIG}`;
    process.env[EK_DEBUG] = oldDebugEnv;
    expect(checkToUseDryRunMode(args)).toBe(true);
    expect(process.env[EK_DEBUG]).toBe(newDebugEnv);
    expect(debugFty.enable).toBeCalledWith(newDebugEnv);
  });
});
