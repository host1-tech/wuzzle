import {} from 'debug';
declare module 'debug' {
  interface Debugger {
    useColors: boolean;
  }
}
