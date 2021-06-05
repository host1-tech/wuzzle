#!/usr/bin/env ts-node

import execa from 'execa';

const [, , ...args] = process.argv;

execa.sync('yarn', ['jest', '--no-cache', ...args], { stdio: 'inherit' });
