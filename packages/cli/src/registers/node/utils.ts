import { merge } from 'lodash';
import path from 'path';
import shelljs from 'shelljs';
import { EK_NODE_LIKE_EXTRA_OPTIONS } from '../../constants';

export interface NodeLikeExtraOptions {
  exts: string[];
}

export function mergeNodeLikeExtraOptionsFromEnv(
  nodeLikeExtraOptions: NodeLikeExtraOptions
): NodeLikeExtraOptions {
  try {
    merge(nodeLikeExtraOptions, JSON.parse(process.env[EK_NODE_LIKE_EXTRA_OPTIONS] || '{}'));
  } catch {}

  return nodeLikeExtraOptions;
}

export function calculateNodePathForTransformCli(transformCliPath: string): string {
  const { ext } = path.parse(transformCliPath);
  return ext == '.ts' ? shelljs.which('ts-node').stdout : process.argv0;
}
