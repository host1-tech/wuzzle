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
  const defaultExecOpts: Mutable<execa.SyncOptions> = {};
  if (!('stdio' in userExecOpts)) {
    (['stdin', 'stdout', 'stderr'] as const).forEach(k => (defaultExecOpts[k] = 'inherit'));
  }

  const execOpts: execa.SyncOptions = { ...defaultExecOpts, ...userExecOpts };
  try {
    return execa.sync(nodePath, execArgs, execOpts);
  } catch (e) {
    if (
      !(
        execOpts.stderr === 'inherit' ||
        execOpts.stdio === 'inherit' ||
        (Array.isArray(execOpts.stdio) && execOpts.stdio[2] === 'inherit')
      )
    ) {
      logError(e);
    }
    process.exit(EXIT_CODE_ERROR);
  }
}
