#!/usr/bin/env ts-node

/**
 * Command helpers for fixtures managing
 */
import { program } from 'commander';
import execa from 'execa';
import glob from 'glob';
import os from 'os';
import pMap from 'p-map';
import path from 'path';
import shelljs from 'shelljs';

program.command('install [dirs...]').action(async dirs => {
  await pMap(getFixtureDirs(dirs), action, {
    concurrency: process.platform === 'linux' ? os.cpus().length : 1,
  });
  async function action(fixtureDir: string) {
    const installPath = require.resolve('./install');
    const nodePath = process.argv[0];
    const childProc = execa(nodePath, [installPath, fixtureDir], { stdio: 'inherit' });
    await new Promise((resolve, reject) => {
      childProc.on('exit', code => {
        code === 0 ? resolve(0) : reject();
      });
      childProc.on('error', () => reject());
    });
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
