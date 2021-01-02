#!/usr/bin/env ts-node

import execa from 'execa';
import fs from 'fs';
import path from 'path';
import shelljs from 'shelljs';

const nycrc = JSON.parse(fs.readFileSync(path.resolve('.nycrc'), 'utf-8'));
const coverageExclude: string[] = nycrc.coverageExclude;
const coverageReporters: string[] = nycrc.coverageReporters;
const coverageDir = path.resolve('coverage');
const coverageJestDir = path.join(coverageDir, 'jest');
const coverageNycDir = path.join(coverageDir, 'nyc');
const dotNycOutputDir = path.resolve('.nyc_output');
const dotNycOutputCoverageJestFile = path.join(dotNycOutputDir, 'coverage-jest.json');
const dotNycOutputCoverageNycFile = path.join(dotNycOutputDir, 'coverage-nyc.json');
const COVERAGE_FINAL_JSON = 'coverage-final.json';
const [, , ...args] = process.argv;

shelljs.rm('-fr', coverageDir, dotNycOutputDir);

execa.sync(
  'yarn',
  [
    'nyc',
    '--reporter',
    'json',
    '--report-dir',
    coverageNycDir,
    'jest',
    '--coverageReporters',
    'json',
    '--coverageDirectory',
    coverageJestDir,
    '--coverage',
    '--no-cache',
    ...args,
  ],
  {
    stdio: 'inherit',
  }
);

shelljs.rm('-fr', path.join(dotNycOutputDir, '*'));

shelljs.mv(path.join(coverageJestDir, COVERAGE_FINAL_JSON), dotNycOutputCoverageJestFile);

const oldNycCoverage = JSON.parse(
  fs.readFileSync(path.join(coverageNycDir, COVERAGE_FINAL_JSON), 'utf-8')
);
const newNycCoverage: Record<string, unknown> = {};
Object.keys(oldNycCoverage).forEach(k => {
  const v = oldNycCoverage[k];
  newNycCoverage[k.replace(/\//g, '\\')] = { ...v, path: v.path.replace(/\//g, '\\') };
});
fs.writeFileSync(dotNycOutputCoverageNycFile, JSON.stringify(newNycCoverage));

shelljs.rm('-fr', path.join(coverageDir, '*'));

execa.sync(
  'yarn',
  [
    'nyc',
    'report',
    '--report-dir',
    coverageDir,
    ...coverageExclude.reduce<string[]>((a, s) => (a.push('--exclude', s), a), []),
    ...coverageReporters.reduce<string[]>((a, s) => (a.push('--reporter', s), a), []),
  ],
  { stdio: 'inherit' }
);
