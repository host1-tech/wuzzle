import findCacheDir from 'find-cache-dir';
import os from 'os';
import path from 'path';

// EK is short for env key,
// EK scoped constants are used for indexing values from `process.env`
export const EK = {
  RPOJECT_ANCHOR: 'WUZZLE_PROJECT_ANCHOR',
  PROJECT_PATH: 'WUZZLE_PROJECT_PATH',
  COMMAND_NAME: 'WUZZLE_COMMAND_NAME',
  COMMAND_ARGS: 'WUZZLE_COMMAND_ARGS',
  COMMAND_TYPE: 'WUZZLE_COMMAND_TYPE',
  INTERNAL_PRE_CONFIG: 'WUZZLE_INTERNAL_PRE_CONFIG',
  NODE_LIKE_EXTRA_OPTIONS: 'WUZZLE_NODE_LIKE_EXTRA_OPTIONS',
  JEST_EXTRA_OPTIONS: 'WUZZLE_JEST_EXTRA_OPTIONS',
  CACHE_KEY_OF_ENV_KEYS: 'WUZZLE_CACHE_KEY_OF_ENV_KEYS',
  CACHE_KEY_OF_FILE_PATHS: 'WUZZLE_CACHE_KEY_OF_FILE_PATHS',
  DRY_RUN: 'WUZZLE_DRY_RUN',

  // TP is short for third party,
  // TP_ prefixed env keys are used for indexing third party env values
  TP_DEBUG: 'DEBUG',
  TP_SKIP_PREFLIGHT_CHECK: 'SKIP_PREFLIGHT_CHECK',
  TP_DISABLE_NEW_JSX_TRANSFORM: 'DISABLE_NEW_JSX_TRANSFORM',
} as const;

// DN is short for debug namespace,
// DN_ prefixed constants are used for classifying debug logs
export const DN_APPLY_CONFIG = '@wuzzle/cli:applyConfig';

// Exit codes
export const EXIT_CODE_ERROR = 1;
export const EXIT_CODE_USER_TERMINATION = 130;

// Special charactors
export const CHAR_CTRL_D = '\x04';

// Other plain constants
export const ENCODING_TEXT = 'utf8';
export const ENCODING_BINARY = 'latin1';

export const PKG_NAME: string = require('../package.json').name;

export const CACHE_BASE_PATH = findCacheDir({ name: PKG_NAME }) ?? path.join(os.tmpdir(), PKG_NAME);
