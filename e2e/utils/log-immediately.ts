import os from 'os';

export function logImmediately(...texts: string[]): void {
  process.stderr.write(texts.join(' ') + os.EOL);
}
