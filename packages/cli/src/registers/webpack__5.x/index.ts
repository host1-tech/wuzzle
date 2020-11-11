import { addHook } from 'pirates';
import { match, transform } from './transform';

const piratesOptions = {
  exts: ['.js'],
  matcher: (filepath: string) => match.test(filepath),
  ignoreNodeModules: false,
};

addHook(transform, piratesOptions);
