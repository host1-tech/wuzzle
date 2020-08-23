import shelljs from 'shelljs';
import path from 'path';
import findUp from 'find-up';
import minimatch from 'minimatch';

const packageJsonPath = findUp.sync('package.json', { cwd: __filename }) || '';
const projectPath = path.dirname(packageJsonPath);
const commandPath = path.resolve(projectPath, 'src/bin/wuzzle.ts');

const { SMOKE_TESTING = '' } = process.env;

describe('@wuzzle/cli - smoke testing', () => {
  it('should work with webpack 4.x', () => {
    if (!minimatch('webpack__4.x', SMOKE_TESTING)) return;

    const fixturePath = path.resolve(projectPath, '__tests__/fixtures/webpack__4.x');
    shelljs.cd(fixturePath);
    shelljs.exec(`ts-node ${commandPath} webpack`);
  });

  it('should work with webpack 5.x', () => {
    if (!minimatch('webpack__5.x', SMOKE_TESTING)) return;

    const fixturePath = path.resolve(projectPath, '__tests__/fixtures/webpack__5.x');
    shelljs.cd(fixturePath);
    shelljs.exec(`ts-node ${commandPath} webpack`);
  });

  it('should work with react-scripts 3.x', () => {
    if (!minimatch('react-scripts__3.x', SMOKE_TESTING)) return;

    const fixturePath = path.resolve(projectPath, '__tests__/fixtures/react-scripts__3.x');
    shelljs.cd(fixturePath);
    shelljs.exec(`cross-env SKIP_PREFLIGHT_CHECK=true ts-node ${commandPath} react-scripts build`);
  });

  it('should work with electron-webpack 2.x', () => {
    if (!minimatch('electron-webpack__2.x', SMOKE_TESTING)) return;

    const fixturePath = path.resolve(projectPath, '__tests__/fixtures/electron-webpack__2.x');
    shelljs.cd(fixturePath);
    shelljs.exec(`ts-node ${commandPath} electron-webpack --progress=false`);
  });
});
