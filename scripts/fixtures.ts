#!/usr/bin/env ts-node

import { blue, grey } from 'chalk';
import { program } from 'commander';
import glob from 'glob';
import shelljs from 'shelljs';
import path from 'path';

const cwd = process.cwd();

const fixtureDirs = glob.sync('**/__tests__/fixtures/*/', {
  ignore: ['**/node_modules/**'],
});

program.command('install').action(() => {
  fixtureDirs.forEach(fixtureDir => {
    shelljs.cd(path.resolve(cwd, fixtureDir));
    console.log(blue(`Install deps in '${fixtureDir}'`));
    if (shelljs.test('-f', 'package.json')) {
      shelljs.exec('yarn');
    } else {
      console.log(grey(`No 'package.json' found, skip '${fixtureDir}'`));
    }
  });
});

program.parse(process.argv);
