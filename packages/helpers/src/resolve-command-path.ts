import fs from 'fs';
import path from 'path';
import readCmdShim from 'read-cmd-shim';

export interface ResolveCommandPathOptions {
  cwd?: string;
  commandName: string;
}

export function resolveCommandPath({
  cwd = process.cwd(),
  commandName,
}: ResolveCommandPathOptions): string {
  const commandLink = path.join(cwd, 'node_modules/.bin', commandName);
  let linkContent;
  try {
    linkContent = fs.readlinkSync(commandLink);
  } catch {
    linkContent = readCmdShim.sync(commandLink);
  }
  return path.join(commandLink, '..', linkContent);
}
