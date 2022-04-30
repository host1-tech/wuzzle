#!/usr/bin/env ts-node

/**
 * On master branch, publishes prerelease versions. On release branch, publishes release versions,
 * then merges generated commits back into master branch in a fast-forward manner.
 */

import execa from 'execa';

const { NPM_REGISTRY_URL, GH_TOKEN, NODE_AUTH_TOKEN } = process.env;
if (!NPM_REGISTRY_URL || !GH_TOKEN || !NODE_AUTH_TOKEN) {
  throw new Error('Required envs are not prepared');
}

const BRANCH_PRERELEASE = 'master';
const BRANCH_RELEASE = 'release';

const branchToArgs: Record<string, string[]> = {
  [BRANCH_PRERELEASE]: ['--conventional-prerelease'],
  [BRANCH_RELEASE]: ['--conventional-graduate'],
};

const branch = execa.sync('git', ['rev-parse', '--abbrev-ref', 'HEAD']).stdout;
const changingArgs = branchToArgs[branch];
if (!changingArgs) {
  throw new Error(`Publishing on branch '${branch}' is not allowed`);
}

const constantArgs = [
  'lerna',
  'publish',
  '--yes',
  '--create-release',
  'github',
  '--registry',
  NPM_REGISTRY_URL,
];
execa.sync('yarn', [...constantArgs, ...changingArgs], { stdio: 'inherit' });

if (branch === BRANCH_RELEASE) {
  [
    ['git', 'checkout', BRANCH_PRERELEASE],
    ['git', 'merge', '--ff-only', BRANCH_RELEASE],
    ['git', 'push', 'origin', BRANCH_PRERELEASE],
  ].forEach(([file, ...args]) => execa.sync(file, args, { stdio: 'inherit' }));
}
