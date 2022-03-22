import { logError } from '@wuzzle/helpers';
import findUp from 'find-up';
import path from 'path';
import { EK_PROJECT_PATH, EK_RPOJECT_ANCHOR, EXIT_CODE_ERROR } from '../constants';

export function locateProjectAnchor(): string {
  const anchorName = process.env[EK_RPOJECT_ANCHOR] || 'package.json';
  const anchorPath = findUp.sync(anchorName);
  if (!anchorPath) {
    logError(`error: '${anchorName}' not located.`);
    process.exit(EXIT_CODE_ERROR);
  }
  const projectPath = path.dirname(anchorPath);
  process.env[EK_PROJECT_PATH] = projectPath;
  return projectPath;
}
