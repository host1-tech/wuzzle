import { resolveRequire } from '../../packages/helpers/lib';

export function genWuzzleExec(command: string, envOverrides: Record<string, string> = {}) {
  const envMap: Record<string, string> = { DEBUG: '@wuzzle/cli:applyConfig', ...envOverrides };
  const envPre = Object.keys(envMap)
    .map(k => `cross-env ${k}=${envMap[k]}`)
    .join(' ');
  return `${envPre} ${resolveRequire('../../packages/wuzzle/bin/wuzzle')} ${command}`;
}
