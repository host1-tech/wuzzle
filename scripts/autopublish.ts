#!/usr/bin/env ts-node

import execa from 'execa';

const { NPM_REGISTRY_URL, GH_TOKEN, NODE_AUTH_TOKEN } = process.env;
if (!NPM_REGISTRY_URL || !GH_TOKEN || !NODE_AUTH_TOKEN) {
  throw new Error('Required envs are not prepared');
}

const branchToArgs: Record<string, string[]> = {
  ['master']: ['--conventional-prerelease'],
  ['publish']: ['--conventional-graduate'],
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
