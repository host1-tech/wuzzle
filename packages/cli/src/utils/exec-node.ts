import execa from 'execa';
import { EK_COMMAND_ARGS } from '../constants';

export interface ExecNodeOptions {
  nodePath?: string;
  args?: string[];
  execArgs?: string[];
  execOpts?: execa.SyncOptions;
}

export function execNode({
  nodePath = process.argv[0],
  args = [],
  execArgs = args,
  execOpts = {},
}: ExecNodeOptions): void {
  try {
    process.env[EK_COMMAND_ARGS] = JSON.stringify(args);
    execa.sync(nodePath, execArgs, { stdio: 'inherit', ...execOpts });
  } catch (e) {
    console.error(e.stack ?? e);
    process.exit(1);
  }
}
