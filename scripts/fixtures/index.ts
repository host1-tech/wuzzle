#!/usr/bin/env ts-node

import { program } from 'commander';
import execa from 'execa';
import glob from 'glob';
import os from 'os';
import pMap from 'p-map';
import path from 'path';
import shelljs from 'shelljs';

shelljs.cd(path.resolve('e2e'));

const fixtureDirs = glob.sync('**/fixtures/*', {
  absolute: true,
  ignore: ['**/*-global/**', '**/node_modules/**'],
});

program.command('install').action(async () => {
  await pMap(fixtureDirs, action, {
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

program.command('clean').action(() => {
  fixtureDirs.forEach(fixtureDir => {
    shelljs.cd(fixtureDir);
    shelljs.rm('-fr', '*-global', 'node_modules', 'yarn.lock');
  });
});

program.parse(process.argv);
