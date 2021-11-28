export function concatEnvPath(envPathA?: string, envPathB?: string): string | undefined {
  const sep = process.platform === 'win32' ? ';' : ':';
  return envPathA === undefined
    ? envPathB
    : envPathB === undefined
    ? envPathA
    : `${envPathA}${sep}${envPathB}`;
}
