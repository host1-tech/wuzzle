#!/usr/bin/env ts-node

import execa from 'execa';
import path from 'path';

const [, , ...args] = process.argv;

const tsconfigPaths = ['packages/helpers', 'packages/cli'].map(p =>
  path.join(p, 'tsconfig.prod.json')
);

execa.sync('yarn', ['tsc', '--build', ...tsconfigPaths, ...args], { stdio: 'inherit' });
