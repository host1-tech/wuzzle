import debugFty from 'debug';
import { DN_APPLY_CONFIG, EK_DEBUG, EK_DRY_RUN } from '../constants';

export const dryRunModeCommandOptionName = '--dry-run';

export function checkToUseDryRunMode(args: string[]): boolean {
  if (args.includes(dryRunModeCommandOptionName)) {
    args.splice(args.indexOf(dryRunModeCommandOptionName), 1);
    process.env[EK_DRY_RUN] = 'true';
    const oldEnvDebug = process.env[EK_DEBUG];
    const newEnvDebug = oldEnvDebug ? `${oldEnvDebug},${DN_APPLY_CONFIG}` : DN_APPLY_CONFIG;
    process.env[EK_DEBUG] = newEnvDebug;
    debugFty.enable(newEnvDebug);
    return true;
  }
  return false;
}
