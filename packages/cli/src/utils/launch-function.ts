import { MaybePromise } from '@wuzzle/helpers';

export interface LaunchOptions {
  nodePath: string;
  args: string[];
  projectPath: string;
  commandName: string;
}

export interface LaunchFunction {
  (options: LaunchOptions): MaybePromise<void>;
}
