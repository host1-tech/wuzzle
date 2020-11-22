import findUp from 'find-up';
import path from 'path';
import shelljs from 'shelljs';
import applyConfig from './applyConfig';

const projectPath = path.dirname(findUp.sync('package.json', { cwd: __filename })!);
const fixturePath = path.resolve(projectPath, '__tests__/fixtures/apply-config');

describe('src/applyConfig', () => {
  it(`uses side effect of 'modify'`, () => {
    shelljs.cd(path.resolve(fixturePath, 'modify'));
    const webpackConfig = applyConfig({});
    expect(webpackConfig.output).toEqual({});
  });

  it(`uses returned value of 'modify'`, () => {
    shelljs.cd(path.resolve(fixturePath, 'modify-and-return'));
    const webpackConfig = applyConfig({});
    expect(webpackConfig.output).toEqual({});
  });

  it(`uses exported function as 'modify'`, () => {
    shelljs.cd(path.resolve(fixturePath, 'export-function'));
    const webpackConfig = applyConfig({});
    expect(webpackConfig.output).toEqual({});
  });
});
