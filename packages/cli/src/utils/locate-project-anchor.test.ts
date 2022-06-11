import findUp from 'find-up';
import path from 'path';
import { mocked } from 'ts-jest/utils';

import { logError } from '@wuzzle/helpers';

import { EK, EXIT_CODE_ERROR } from '../constants';
import { envSet } from './env-get-set';
import { locateProjectAnchor } from './locate-project-anchor';

const projectAnchorPath = '/path/to/project/anchor';
const projectPath = path.dirname(projectAnchorPath);

jest.mock('@wuzzle/helpers');

jest.mock('find-up', () => ({
  __esModule: true,
  default: Object.assign(jest.fn(), { sync: jest.fn() }),
}));
mocked(findUp.sync).mockReturnValue(projectAnchorPath);

jest.mock('./env-get-set');

jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});

describe('locateProjectAnchor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns project path and sets result as env if anchor located', () => {
    expect(locateProjectAnchor()).toBe(projectPath);
    expect(envSet).toBeCalledWith(EK.PROJECT_PATH, projectPath);
  });

  it('reports error and terminates process if anchor not located', () => {
    mocked(findUp.sync).mockReturnValueOnce(undefined);
    try {
      locateProjectAnchor();
    } catch {}
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
    expect(logError).toBeCalledWith(expect.stringContaining('error:'));
  });
});
