#!/usr/bin/env ts-node

import execa from 'execa';

const branchToArgs: Record<string, string[]> = {
  ['master']: ['--conventional-prerelease'],
  ['publish']: ['--conventional-graduate'],
};

const branch = execa.sync('git', ['rev-parse', '--abbrev-ref', 'HEAD']).stdout;
const changingArgs = branchToArgs[branch];
if (!changingArgs) {
  throw new Error(`Publishing on branch '${branch}' is not allowed`);
}

const { GH_TOKEN, NODE_AUTH_TOKEN } = process.env;
if (!GH_TOKEN || !NODE_AUTH_TOKEN) {
  throw new Error('Required envs are not found');
}

const constantArgs = [
  'lerna',
  'publish',
  '--create-release',
  'github',
  '--registry',
  'https://registry.npmjs.org',
];
execa.sync('yarn', [...constantArgs, ...changingArgs], { stdio: 'inherit' });
