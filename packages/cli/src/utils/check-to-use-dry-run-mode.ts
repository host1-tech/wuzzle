import debugFty from 'debug';
import { DN_APPLY_CONFIG, EK } from '../constants';
import { envGet, envSet } from './env-get-set';

export const dryRunModeCommandOptionName = '--dry-run';

export function checkToUseDryRunMode(args: string[]): boolean {
  if (args.includes(dryRunModeCommandOptionName)) {
    args.splice(args.indexOf(dryRunModeCommandOptionName), 1);
    envSet(EK.DRY_RUN, 'true');
    const oldEnvDebug = envGet(EK.TP_DEBUG);
    const newEnvDebug = oldEnvDebug ? `${oldEnvDebug},${DN_APPLY_CONFIG}` : DN_APPLY_CONFIG;
    envSet(EK.TP_DEBUG, newEnvDebug);
    debugFty.enable(newEnvDebug);
    return true;
  }
  return false;
}
