import { _extensions } from 'module';
import path from 'path';
import resolve from 'resolve';
import { resolveRequire } from './resolve-require';

const targetPath = '/path/to/resolve';

let builtInExtensions: string[];
jest.mock('module', () => {
  builtInExtensions = ['.js', '.json', '.node'];
  return {
    _extensions: builtInExtensions.reduce((a, k) => {
      a[k] = () => {};
      return a;
    }, {} as typeof _extensions),
  };
});

let callerPath: string;
jest.mock('resolve/lib/caller', () => {
  callerPath = '/path/to/caller';
  return { __esModule: true, default: () => callerPath };
});

jest.spyOn(resolve, 'sync').mockReturnValue('');

describe('resolveRequire', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it(`extends built in extensions with '.ts' and calculates base dir from caller by default`, () => {
    resolveRequire(targetPath);
    expect(resolve.sync).toBeCalledWith(targetPath, {
      extensions: [...builtInExtensions, '.ts'],
      basedir: path.dirname(callerPath),
    });
  });

  it('eliminates duplicated extensions', () => {
    resolveRequire(targetPath, { extensions: ['.js'] });
    expect(resolve.sync).toBeCalledWith(
      targetPath,
      expect.objectContaining({ extensions: [...builtInExtensions, '.ts'] })
    );
  });

  it('overrides base dir if provided', () => {
    const basedir = '/path/to/basedir';
    resolveRequire(targetPath, { basedir });
    expect(resolve.sync).toBeCalledWith(targetPath, expect.objectContaining({ basedir }));
  });
});
