import { merge } from 'lodash';
import path from 'path';
import shelljs from 'shelljs';

export const NODE_LIKE_EXTRA_OPTIONS_ENV_KEY = 'WUZZLE_NODE_LIKE_EXTRA_OPTIONS';

export interface NodeLikeExtraOptions {
  exts: string[];
}

export function mergeNodeLikeExtraOptionsFromEnv(
  nodeLikeExtraOptions: NodeLikeExtraOptions
): NodeLikeExtraOptions {
  try {
    merge(nodeLikeExtraOptions, JSON.parse(process.env[NODE_LIKE_EXTRA_OPTIONS_ENV_KEY] || '{}'));
  } catch {}

  return nodeLikeExtraOptions;
}

export function calculateNodePathForTransformCli(transformCliPath: string): string {
  const { ext } = path.parse(transformCliPath);
  return ext == '.ts' ? shelljs.which('ts-node').stdout : process.argv0;
}
