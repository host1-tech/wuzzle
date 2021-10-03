import fs from 'fs';

export const BACKUP_FILE_EXT = '.bak';

/**
 * Backup the target file. If the backup already exists, restore the target file from it.
 */
export function backupWithRestore(targetFilepath: string): void {
  const backupFilepath = `${targetFilepath}${BACKUP_FILE_EXT}`;

  try {
    fs.copyFileSync(backupFilepath, targetFilepath);
  } catch {
    fs.copyFileSync(targetFilepath, backupFilepath);
  }
}

/**
 * Restore the original target file from the backup and remove the backup.
 */
export function restoreWithRemove(targetFilepath: string): void {
  const backupFilepath = `${targetFilepath}${BACKUP_FILE_EXT}`;

  fs.renameSync(backupFilepath, targetFilepath);
}
