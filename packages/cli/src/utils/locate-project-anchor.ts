import { logError } from '@wuzzle/helpers';
import findUp from 'find-up';
import path from 'path';
import { EK, EXIT_CODE_ERROR } from '../constants';
import { envGet, envSet } from './env-get-set';

export function locateProjectAnchor(): string {
  const projectAnchor = envGet(EK.RPOJECT_ANCHOR);
  const projectAnchorPath = findUp.sync(projectAnchor);
  if (!projectAnchorPath) {
    logError(`error: '${projectAnchor}' not located.`);
    process.exit(EXIT_CODE_ERROR);
  }
  const projectPath = path.dirname(projectAnchorPath);
  envSet(EK.PROJECT_PATH, projectPath);
  return projectPath;
}
