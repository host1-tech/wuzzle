declare module 'read-cmd-shim' {
  const readCmdShim: {
    (path: string): Promise<string>;
    sync(path: string): string;
  };
  export default readCmdShim;
}

declare module 'resolve/lib/caller' {
  function caller(): string;
  export default caller;
}

declare module 'module' {
  export const _extensions: Record<string, Function>;
}
