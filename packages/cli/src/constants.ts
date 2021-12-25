import findCacheDir from 'find-cache-dir';
import os from 'os';
import path from 'path';

// EK is short for env key,
// EK_ prefixed constants are used for indexing values from `process.env`
export const EK_RPOJECT_ANCHOR = 'WUZZLE_PROJECT_ANCHOR';
export const EK_PROJECT_PATH = 'WUZZLE_PROJECT_PATH';
export const EK_NODE_LIKE_EXTRA_OPTIONS = 'WUZZLE_NODE_LIKE_EXTRA_OPTIONS';
export const EK_JEST_EXTRA_OPTIONS = 'WUZZLE_JEST_EXTRA_OPTIONS';
export const EK_COMMAND_NAME = 'WUZZLE_COMMAND_NAME';
export const EK_COMMAND_ARGS = 'WUZZLE_COMMAND_ARGS';
export const EK_INTERNAL_PRE_CONFIG = 'WUZZLE_INTERNAL_PRE_CONFIG';
export const EK_CACHE_KEY_OF_ENV_KEYS = 'WUZZLE_CACHE_KEY_OF_ENV_KEYS';
export const EK_CACHE_KEY_OF_FILE_PATHS = 'WUZZLE_CACHE_KEY_OF_FILE_PATHS';
export const EK_DRY_RUN = 'WUZZLE_DRY_RUN';

export const EK_DEBUG = 'DEBUG';

export const EK_REACT_SCRIPTS_SKIP_PREFLIGHT_CHECK = 'SKIP_PREFLIGHT_CHECK';
export const EK_REACT_SCRIPTS_DISABLE_NEW_JSX_TRANSFORM = 'DISABLE_NEW_JSX_TRANSFORM';

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

export const PKG_NAME: string = require('../package.json').name;

export const CACHE_BASE_PATH = findCacheDir({ name: PKG_NAME }) ?? path.join(os.tmpdir(), PKG_NAME);
export const CACHE_KEY_DEFAULT_OF_ENV_KEYS = ['*_ENV'];
export const CACHE_KEY_DEFAULT_OF_FILE_PATHS = ['*rc', '*.[jt]s?(x)', '*.json', '*.y?(a)ml'];
