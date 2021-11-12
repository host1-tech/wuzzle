import findUp from 'find-up';
import { noop } from 'lodash';
import path from 'path';
import { mocked } from 'ts-jest/utils';
import { EK_PROJECT_PATH, EK_RPOJECT_ANCHOR, EXIT_CODE_ERROR } from '../constants';
import { locateProjectAnchor } from './locate-project-anchor';

const anchorPath = '/path/to/anchor';
const projectPath = path.dirname(anchorPath);

jest.mock('find-up', () => ({
  __esModule: true,
  default: Object.assign(jest.fn(), { sync: jest.fn() }),
}));
mocked(findUp.sync).mockReturnValue(anchorPath);

jest.spyOn(console, 'error').mockImplementation(noop);
jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});

describe('locateProjectAnchor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env[EK_RPOJECT_ANCHOR];
    delete process.env[EK_PROJECT_PATH];
  });

  it('returns project path and sets result as env if anchor located', () => {
    expect(locateProjectAnchor()).toBe(projectPath);
    expect(process.env[EK_PROJECT_PATH]).toBe(projectPath);
  });

  it('reports error and terminates process if anchor not lacated', () => {
    mocked(findUp.sync).mockReturnValueOnce(undefined);
    try {
      locateProjectAnchor();
    } catch {}
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
    expect(console.error).toBeCalledWith(expect.stringContaining('error:'));
  });

  it('finds up specific anchor if anchor env specified', () => {
    const anchorName = 'a4b7e86';
    process.env[EK_RPOJECT_ANCHOR] = anchorName;
    locateProjectAnchor();
    expect(findUp.sync).toBeCalledWith(anchorName);
  });
});
