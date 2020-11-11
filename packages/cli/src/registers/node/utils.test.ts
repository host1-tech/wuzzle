import { cloneDeep } from 'lodash';
import {
  mergeNodeLikeExtraOptionsFromEnv,
  NodeLikeExtraOptions,
  NODE_LIKE_EXTRA_OPTIONS_ENV_KEY,
  calculateNodePathForTransformCli,
} from './utils';

describe('mergeNodeLikeExtraOptionsFromEnv', () => {
  it('merges values when json in env', () => {
    process.env[NODE_LIKE_EXTRA_OPTIONS_ENV_KEY] = JSON.stringify({
      exts: ['.ts'],
    });
    const nodeLikeExtraOptions: NodeLikeExtraOptions = {
      exts: ['.js'],
    };
    mergeNodeLikeExtraOptionsFromEnv(nodeLikeExtraOptions);
    expect(nodeLikeExtraOptions.exts).toContain('.ts');
  });

  it('keeps values when env unset', () => {
    delete process.env[NODE_LIKE_EXTRA_OPTIONS_ENV_KEY];

    const nodeLikeExtraOptions: NodeLikeExtraOptions = {
      exts: ['.js'],
    };
    const nodeLikeExtraOptionsSnapshot = cloneDeep(nodeLikeExtraOptions);
    mergeNodeLikeExtraOptionsFromEnv(nodeLikeExtraOptions);
    expect(nodeLikeExtraOptions).toEqual(nodeLikeExtraOptionsSnapshot);
  });

  it('keeps values when non-json in env', () => {
    process.env[NODE_LIKE_EXTRA_OPTIONS_ENV_KEY] = 'just a plain string';
    const nodeLikeExtraOptions: NodeLikeExtraOptions = {
      exts: ['.js'],
    };
    const nodeLikeExtraOptionsSnapshot = cloneDeep(nodeLikeExtraOptions);
    mergeNodeLikeExtraOptionsFromEnv(nodeLikeExtraOptions);
    expect(nodeLikeExtraOptions).toEqual(nodeLikeExtraOptionsSnapshot);
  });
});

describe('calculateNodePathForTransformCli', () => {
  it('returns node path for .js suffixed path', () => {
    expect(calculateNodePathForTransformCli('path/to/a.js')).toMatch(/\/node$/);
  });

  it('returns ts-node path for .ts suffixed path', () => {
    expect(calculateNodePathForTransformCli('path/to/a.ts')).toMatch(/\/ts-node$/);
  });
});
