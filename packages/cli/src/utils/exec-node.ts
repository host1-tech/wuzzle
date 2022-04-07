import { logError, Mutable } from '@wuzzle/helpers';
import execa, { ExecaSyncReturnValue } from 'execa';
import { EXIT_CODE_ERROR } from '../constants';

export interface ExecNodeOptions {
  nodePath?: string;
  execArgs?: string[];
  execOpts?: execa.SyncOptions;
}

export function execNode({
  nodePath = process.argv[0],
  execArgs = [],
  execOpts: userExecOpts = {},
}: ExecNodeOptions): ExecaSyncReturnValue {
  const defaultExecOpts: Mutable<execa.SyncOptions> = {
    stdout: 'inherit',
    stderr: 'inherit',
  };
  if ('stdio' in userExecOpts) {
    delete defaultExecOpts.stdout;
    delete defaultExecOpts.stderr;
  }

  const execOpts: execa.SyncOptions = { ...defaultExecOpts, ...userExecOpts };
  try {
    return execa.sync(nodePath, execArgs, execOpts);
  } catch (e) {
    if (execOpts.stderr !== 'inherit' && execOpts.stdio !== 'inherit') {
      logError(e);
    }
    process.exit(EXIT_CODE_ERROR);
  }
}
