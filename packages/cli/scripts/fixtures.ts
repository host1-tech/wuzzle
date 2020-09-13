#!/usr/bin/env ts-node

import { program } from 'commander';
import shelljs from 'shelljs';
import { blue, grey } from 'chalk';

program.command('install').action(() => {
  const fixturesPath = '__tests__/fixtures';
  shelljs.cd(fixturesPath);
  shelljs.ls().forEach(dirname => {
    console.log(blue(`Install deps in \`${dirname}\``));
    shelljs.cd(dirname);
    if (shelljs.test('-f', 'package.json')) {
      shelljs.exec('yarn');
    } else {
      console.log(grey(`No \`package.json\` found, skip \`${dirname}\``));
    }
    shelljs.cd('..');
  });
});

program.parse(process.argv);
