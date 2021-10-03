import fs from 'fs';
import { mocked } from 'ts-jest/utils';

import { BACKUP_FILE_EXT, backupWithRestore, restoreWithRemove } from './backup';

jest.spyOn(fs, 'copyFileSync');
jest.spyOn(fs, 'renameSync');

const targetFilepath = '/path/to/target/file';
const backupFilepath = `${targetFilepath}${BACKUP_FILE_EXT}`;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('backupWithRestore', () => {
  it('backups from target but fails restoring', () => {
    mocked(fs.copyFileSync).mockImplementation((src: fs.PathLike) => {
      if (src === backupFilepath) throw 0;
    });

    backupWithRestore(targetFilepath);

    expect(fs.copyFileSync).toBeCalledTimes(2);
    expect(fs.copyFileSync).toHaveBeenNthCalledWith(1, backupFilepath, targetFilepath);
    expect(fs.copyFileSync).toHaveBeenNthCalledWith(2, targetFilepath, backupFilepath);
  });

  it('restores target and untouches backup if backup exists', () => {
    mocked(fs.copyFileSync).mockReturnValue();

    backupWithRestore(targetFilepath);
    expect(fs.copyFileSync).toBeCalledTimes(1);
    expect(fs.copyFileSync).toHaveBeenCalledWith(backupFilepath, targetFilepath);
  });
});

describe('restoreWithRemove', () => {
  it('restores target and removes the backup', () => {
    mocked(fs.renameSync).mockReturnValue();
    restoreWithRemove(targetFilepath);
    expect(fs.renameSync).toHaveBeenCalledWith(backupFilepath, targetFilepath);
  });
});
