#!/usr/bin/env ts-node

import { program } from 'commander';
import shelljs from 'shelljs';
import { blue } from 'chalk';

program.command('install').action(() => {
  const fixturesPath = '__tests__/fixtures';
  shelljs.cd(fixturesPath);
  shelljs.ls().forEach(dirname => {
    console.log(blue(`Install in '${dirname}'`));
    shelljs.cd(dirname);
    shelljs.exec('yarn');
    shelljs.cd('..');
  });
});

program.parse(process.argv);
