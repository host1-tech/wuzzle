import { values } from 'lodash';
import { addHook } from 'pirates';
import { matches, transform } from './transform';

const piratesOptions = {
  exts: ['.js'],
  matcher: (filepath: string) => values(matches).some(m => m.test(filepath)),
  ignoreNodeModules: false,
};

addHook(transform, piratesOptions);
