import { cloneDeep, mergeWith, uniq } from 'lodash';
import { EK } from '../constants';
import type { JestExtraOptions } from './apply-jest-extra-options';
import type { NodeLikeExtraOptions } from './apply-node-like-extra-options';

export type EnvKey = typeof EK[keyof typeof EK];

export interface EnvGetSet<T> {
  get(): T;
  set(envVal: T): void;
  readonly envDefaultVal: T;
}

export function optionalStringEnvGetSet(envKey: EnvKey): EnvGetSet<string | undefined> {
  function get(): string | undefined {
    return process.env[envKey];
  }
  function set(envVal: string | undefined): void {
    process.env[envKey] = envVal;
  }
  return { get, set, envDefaultVal: undefined };
}

export function requiredStringEnvGetSet(envKey: EnvKey, envDefaultVal: string): EnvGetSet<string> {
  const { get: optionalGet, set } = optionalStringEnvGetSet(envKey);
  function get(): string {
    return optionalGet() ?? envDefaultVal;
  }
  return { get, set, envDefaultVal };
}

export function optionalObjectEnvGetSet<T>(envKey: EnvKey): EnvGetSet<T | undefined> {
  function get(): T | undefined {
    let envVal: T | undefined;
    try {
      envVal = JSON.parse(process.env[envKey]!);
    } catch {}
    return envVal;
  }
  function set(envVal: T | undefined): void {
    process.env[envKey] = JSON.stringify(envVal);
  }
  return { get, set, envDefaultVal: undefined };
}

export function requiredObjectEnvGetSet<T>(envKey: EnvKey, envDefaultVal: T): EnvGetSet<T> {
  const { get: optionalGet, set } = optionalObjectEnvGetSet<T>(envKey);
  function get(): T {
    return optionalGet() ?? envDefaultVal;
  }
  return { get, set, envDefaultVal };
}

export function optionalObjectEnvGetSetWithCustomMerge<T>(
  envKey: EnvKey,
  customMerge: (a: T | undefined, b: T | undefined) => T | undefined
): EnvGetSet<T | undefined> {
  const { get, set: regularSet } = optionalObjectEnvGetSet<T>(envKey);
  function set(envVal: T | undefined): void {
    try {
      regularSet(customMerge(get(), envVal));
    } catch {
      regularSet(envVal);
    }
  }
  return { get, set, envDefaultVal: undefined };
}

export function requiredObjectEnvGetSetWithCustomMerge<T>(
  envKey: EnvKey,
  envDefaultVal: T,
  customMerge: (a: T, b: T) => T
): EnvGetSet<T> {
  const { get, set: regularSet } = requiredObjectEnvGetSet<T>(envKey, envDefaultVal);
  function set(envVal: T): void {
    try {
      regularSet(customMerge(get(), envVal));
    } catch {
      regularSet(envVal);
    }
  }
  return { get, set, envDefaultVal };
}

export const envGetSetMap = {
  [EK.RPOJECT_ANCHOR]: requiredStringEnvGetSet(EK.RPOJECT_ANCHOR, 'package.json'),
  [EK.PROJECT_PATH]: requiredStringEnvGetSet(EK.PROJECT_PATH, process.cwd()),
  [EK.NODE_LIKE_EXTRA_OPTIONS]: requiredObjectEnvGetSetWithCustomMerge<NodeLikeExtraOptions>(
    EK.NODE_LIKE_EXTRA_OPTIONS,
    { verbose: true, exts: ['.js'] },
    (a, b) =>
      mergeWith({}, a, b, (a, b) => {
        if (Array.isArray(a) && Array.isArray(b)) {
          return uniq([...a, ...b]);
        }
      })
  ),
  [EK.JEST_EXTRA_OPTIONS]: requiredObjectEnvGetSetWithCustomMerge<JestExtraOptions>(
    EK.JEST_EXTRA_OPTIONS,
    { webpack: true },
    (a, b) => Object.assign({}, a, b)
  ),
  [EK.COMMAND_NAME]: requiredStringEnvGetSet(EK.COMMAND_NAME, 'unknown'),
  [EK.COMMAND_ARGS]: requiredObjectEnvGetSet<string[]>(EK.COMMAND_ARGS, []),
  [EK.COMMAND_TYPE]: requiredStringEnvGetSet(EK.COMMAND_TYPE, 'default'),
  [EK.INTERNAL_PRE_CONFIG]: optionalStringEnvGetSet(EK.INTERNAL_PRE_CONFIG),
  [EK.CACHE_KEY_OF_ENV_KEYS]: requiredObjectEnvGetSet<string[]>(EK.CACHE_KEY_OF_ENV_KEYS, [
    '*_ENV',
  ]),
  [EK.CACHE_KEY_OF_FILE_PATHS]: requiredObjectEnvGetSet<string[]>(EK.CACHE_KEY_OF_FILE_PATHS, [
    '*rc',
    '*.[jt]s?(x)',
    '*.json',
    '*.y?(a)ml',
  ]),
  [EK.DRY_RUN]: optionalStringEnvGetSet(EK.DRY_RUN),

  [EK.TP_DEBUG]: optionalStringEnvGetSet(EK.TP_DEBUG),
  [EK.TP_SKIP_PREFLIGHT_CHECK]: optionalStringEnvGetSet(EK.TP_SKIP_PREFLIGHT_CHECK),
  [EK.TP_DISABLE_NEW_JSX_TRANSFORM]: optionalStringEnvGetSet(EK.TP_DISABLE_NEW_JSX_TRANSFORM),
} as const;

export type EnvGetVal<T extends EnvKey> = ReturnType<typeof envGetSetMap[T]['get']>;
export type EnvSetVal<T extends EnvKey> = Parameters<typeof envGetSetMap[T]['set']>[0];
export type EnvDefaultVal<T extends EnvKey> = typeof envGetSetMap[T]['envDefaultVal'];

export function envGet<T extends EnvKey>(envKey: T): EnvGetVal<T> {
  return envGetSetMap[envKey].get() as never;
}
export function envSet<T extends EnvKey>(envKey: T, envVal: EnvSetVal<T>): void {
  envGetSetMap[envKey].set(envVal as never);
}
export function envGetDefault<T extends EnvKey>(envKey: T): EnvDefaultVal<T> {
  return cloneDeep(envGetSetMap[envKey].envDefaultVal);
}
