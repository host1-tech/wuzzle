import { resolveRequire } from '../../packages/helpers/lib';

export interface GenEndToEndExecOptions {
  command: string;
  envOverrides?: Record<string, string>;
  wrapper?: string;
}

export function genEndToEndExec(options: GenEndToEndExecOptions) {
  const {
    command,
    envOverrides = {},
    wrapper = resolveRequire('../../packages/wuzzle/bin/wuzzle'),
  } = options;
  const envMap: Record<string, string> = { DEBUG: '@wuzzle/cli:applyConfig', ...envOverrides };
  const envPre = Object.keys(envMap)
    .map(k => `cross-env ${k}=${envMap[k]}`)
    .join(' ');
  return `${envPre} ${wrapper} ${command}`;
}
