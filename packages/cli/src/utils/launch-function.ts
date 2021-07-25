export interface LaunchOptions {
  nodePath: string;
  args: string[];
  projectPath: string;
  commandName: string;
}

export interface LaunchFunction {
  (options: LaunchOptions): void;
}
