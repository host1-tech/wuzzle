import fs from 'fs';
import path from 'path';
import readCmdShim from 'read-cmd-shim';
import which from 'which';

export interface ResolveCommandPathOptions {
  cwd?: string;
  commandName: string;
  fromGlobals?: boolean;
}

export function resolveCommandPath({
  cwd = process.cwd(),
  commandName,
  fromGlobals,
}: ResolveCommandPathOptions): string {
  let commandLink: string = path.resolve(cwd, 'node_modules/.bin', commandName);
  if (fromGlobals) {
    commandLink = which.sync(commandName).replace(/\.cmd$/i, '');
  }

  let linkinkContent: string;
  try {
    linkinkContent = fs.readlinkSync(commandLink);
  } catch {
    linkinkContent = readCmdShim.sync(commandLink);
  }
  return path.resolve(path.dirname(commandLink), linkinkContent);
}
