import {
  backupWithRestore,
  MaybeArray,
  resolveRequire,
  tryRestoreWithRemove,
} from '@wuzzle/helpers';
import fs from 'fs';
import { flatten } from 'lodash';
import path from 'path';
import { ENCODING_TEXT } from '../constants';

export interface RegisterOptions {
  commandPath: string;
}

export interface RegisterFunction {
  (options: RegisterOptions): void;
}

export interface UnregisterOptions {
  commandPath: string;
}

export interface UnregisterFunction {
  (options: UnregisterOptions): void;
}

export interface CreateRegisterUnregisterOptions {
  moduleName: string;
  moduleToMatch: MaybeArray<string>;
  transform(code: string, file: string): string;
}

export type RegisterUnregister = [RegisterFunction, UnregisterFunction];

export function createRegisterUnregister(
  options: CreateRegisterUnregisterOptions
): RegisterUnregister {
  const { moduleName, moduleToMatch, transform } = options;
  const modulesToMatch = flatten([moduleToMatch]);

  const register: RegisterFunction = ({ commandPath }) => {
    let hasTransformed: boolean = false;
    for (const moduleToMatch of modulesToMatch) {
      let moduleFilepath: string | undefined;
      try {
        moduleFilepath = resolveRequire(moduleToMatch, {
          basedir: path.dirname(commandPath),
        });
      } catch {}
      if (!moduleFilepath) continue;
      backupWithRestore(moduleFilepath);
      const code = fs.readFileSync(moduleFilepath, ENCODING_TEXT);
      fs.writeFileSync(moduleFilepath, transform(code, moduleFilepath));
      hasTransformed = true;
    }
    if (!hasTransformed) {
      throw new Error(`Cannot resolve ${moduleName} from command path '${commandPath}'`);
    }
  };

  const unregister: UnregisterFunction = ({ commandPath }) => {
    for (const moduleToMatch of modulesToMatch) {
      let moduleFilepath: string | undefined;
      try {
        moduleFilepath = resolveRequire(moduleToMatch, {
          basedir: path.dirname(commandPath),
        });
        tryRestoreWithRemove(moduleFilepath);
      } catch {}
    }
  };

  return [register, unregister];
}
