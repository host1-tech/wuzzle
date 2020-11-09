#!/usr/bin/env ts-node

import execa from 'execa';
import path from 'path';
import shelljs from 'shelljs';

const coverageReporters = ['json', 'text', 'lcov', 'clover'];
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
    ...args,
  ],
  {
    stdio: 'inherit',
  }
);

shelljs.rm('-fr', path.join(dotNycOutputDir, '*'));

shelljs.mv(path.join(coverageJestDir, COVERAGE_FINAL_JSON), dotNycOutputCoverageJestFile);

shelljs.mv(path.join(coverageNycDir, COVERAGE_FINAL_JSON), dotNycOutputCoverageNycFile);

shelljs.rm('-fr', path.join(coverageDir, '*'));

execa.sync(
  'yarn',
  [
    'nyc',
    'report',
    '--report-dir',
    coverageDir,
    ...coverageReporters.reduce((a, s) => (a.push('--reporter', s), a), [] as string[]),
  ],
  { stdio: 'inherit' }
);
