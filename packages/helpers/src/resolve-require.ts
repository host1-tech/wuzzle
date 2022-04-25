import { _extensions } from 'module';
import path from 'path';
import resolve from 'resolve';
import resolveCaller from 'resolve/lib/caller';

export const resolveRequire: typeof resolve.sync = (id, opts = {}) => {
  const extensions = [...new Set([...Object.keys(_extensions), '.ts', ...(opts.extensions ?? [])])];
  const basedir = opts.basedir ?? path.dirname(resolveCaller());
  return resolve.sync(id, { ...opts, extensions, basedir });
};
