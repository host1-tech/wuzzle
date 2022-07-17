#!/usr/bin/env ts-node

/**
 * Command helpers for fixtures managing
 */
import { blue, grey } from 'chalk';
import { program } from 'commander';
import glob from 'glob';
import path from 'path';
import shelljs from 'shelljs';

program.command('install [dirs...]').action(async dirs => {
  for (const fixtureDir of getFixtureDirs(dirs)) {
    const subDir = path.relative(process.cwd(), fixtureDir);
    shelljs.cd(fixtureDir);
    console.log(blue(`Install deps in '${subDir}'`));
    if (shelljs.test('-f', 'package.json')) {
      shelljs.exec('yarn');
    } else {
      console.log(grey(`No 'package.json' found, skip '${subDir}'`));
    }
  }
});

program.command('clean [dirs...]').action(dirs => {
  getFixtureDirs(dirs).forEach(fixtureDir => {
    shelljs.cd(fixtureDir);
    shelljs.rm('-fr', '*-global', 'node_modules', 'yarn.lock');
  });
});

program.parse(process.argv);

function getFixtureDirs(dirs: string[]) {
  const fixtureDirs: string[] = [];
  (dirs.length ? dirs : ['e2e']).forEach(dir => {
    fixtureDirs.push(
      ...glob.sync(path.join(dir, '**/fixtures/*'), {
        absolute: true,
        ignore: ['**/*-global/**', '**/node_modules/**'],
      })
    );
  });
  return fixtureDirs;
}
