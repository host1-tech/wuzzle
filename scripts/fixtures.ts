#!/usr/bin/env ts-node

import { blue, grey } from 'chalk';
import { program } from 'commander';
import glob from 'glob';
import shelljs from 'shelljs';
import path from 'path';

const cwd = process.cwd();
const fixtureDir = 'e2e/fixtures';
const fixtureDirs = glob.sync(fixtureDir + '/*', { ignore: ['**/*-global', '**/node_modules'] });

program.command('install').action(() => {
  fixtureDirs.forEach(fixtureDir => {
    shelljs.cd(path.join(cwd, fixtureDir));
    console.log(blue(`Install deps in '${fixtureDir}'`));
    if (shelljs.test('-f', 'package.json')) {
      shelljs.exec('yarn');
    } else {
      console.log(grey(`No 'package.json' found, skip '${fixtureDir}'`));
    }
  });
});

program.command('clean').action(() => {
  shelljs.cd(path.join(cwd, fixtureDir));
  shelljs.rm('-fr', '*-global', 'node_modules', '*/node_modules', '*/yarn.lock');
});

program.parse(process.argv);
