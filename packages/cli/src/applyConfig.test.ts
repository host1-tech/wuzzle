import findUp from 'find-up';
import path from 'path';
import shelljs from 'shelljs';
import type webpack from 'webpack';
import applyConfig from './applyConfig';
import { EK_INTERNAL_PRE_CONFIG } from './constants';

const projectPath = path.dirname(findUp.sync('package.json', { cwd: __filename })!);
const fixturePath = path.resolve(projectPath, '__tests__/fixtures/apply-config');

describe('src/applyConfig', () => {
  it(`still works with no config found`, () => {
    applyAndExpect('empty', {});
  });

  it(`uses side effect of 'modify'`, () => {
    applyAndExpect('modify', { output: {} });
  });

  it(`uses returned value of 'modify'`, () => {
    applyAndExpect('modify-and-return', { output: {} });
  });

  it(`uses exported function as 'modify'`, () => {
    applyAndExpect('export-function', { output: {} });
  });

  it(`uses side effect of internal pre config`, () => {
    const cwd = path.resolve(fixturePath, 'internal-pre-config');
    process.env[EK_INTERNAL_PRE_CONFIG] = path.resolve(cwd, 'internal-pre-config.js');
    applyAndExpect(cwd, { resolve: {} });
  });

  it(`uses returned value of internal pre config`, () => {
    const cwd = path.resolve(fixturePath, 'internal-pre-config-and-return');
    process.env[EK_INTERNAL_PRE_CONFIG] = path.resolve(cwd, 'internal-pre-config.js');
    applyAndExpect(cwd, { resolve: {} });
  });
});

function applyAndExpect(cwd: string, expectedWebpackConfig: webpack.Configuration) {
  shelljs.cd(path.resolve(fixturePath, cwd));
  const iWebpackConfig: webpack.Configuration = {};
  const oWebpackConfig = applyConfig(iWebpackConfig);
  expect(iWebpackConfig).toBe(oWebpackConfig);
  expect(iWebpackConfig).toEqual(expectedWebpackConfig);
}
