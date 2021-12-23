import { format } from 'util';

export function createDebugLog(ws: NodeJS.WriteStream) {
  return (...args: unknown[]) => {
    return ws.write(format(...args) + '\n');
  };
}

export const stderrDebugLog = createDebugLog(process.stderr);
export const stdoutDebugLog = createDebugLog(process.stdout);
