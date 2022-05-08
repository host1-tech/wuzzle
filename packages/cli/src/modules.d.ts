import 'cacache';
import 'debug';

declare module 'cacache' {
  namespace get {
    function sync(cachePath: string, key: string, opts?: Options): GetCacheObject;
  }
}

declare module 'debug' {
  interface Debugger {
    useColors: boolean;
  }
}
