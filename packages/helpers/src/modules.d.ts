declare module 'read-cmd-shim' {
  const readCmdShim: {
    (path: string): Promise<string>;
    sync(path: string): string;
  };
  export default readCmdShim;
}
