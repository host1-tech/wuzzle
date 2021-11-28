import { blue, grey } from 'chalk';
import path from 'path';
import shelljs from 'shelljs';

const [, , fixtureDir] = process.argv;
const cwd = process.cwd();
const fixtureDirSubPath = path.relative(cwd, fixtureDir);

shelljs.cd(fixtureDir);
console.log(blue(`Install deps in '${fixtureDirSubPath}'`));
if (shelljs.test('-f', 'package.json')) {
  shelljs.exec('yarn');
} else {
  console.log(grey(`No 'package.json' found, skip '${fixtureDirSubPath}'`));
}
