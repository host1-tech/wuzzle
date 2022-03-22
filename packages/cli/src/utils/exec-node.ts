import { logError } from '@wuzzle/helpers';
import execa from 'execa';
import { EXIT_CODE_ERROR } from '../constants';

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
    execa.sync(nodePath, execArgs, { stdio: 'inherit', ...execOpts });
  } catch (e) {
    logError(e);
    process.exit(EXIT_CODE_ERROR);
  }
}
