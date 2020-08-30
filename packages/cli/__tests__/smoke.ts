import shelljs from 'shelljs';
import path from 'path';
import findUp from 'find-up';
import minimatch from 'minimatch';

const packageJsonPath = findUp.sync('package.json', { cwd: __filename }) || '';
const projectPath = path.dirname(packageJsonPath);
const wuzzlePath = path.resolve(projectPath, 'src/bin/wuzzle.ts');
const tsNodeExec = `cross-env DEBUG='@wuzzle/cli:applyConfig' cross-env TS_NODE_TYPE_CHECK=false ts-node`;

const { SMOKE_TESTING = '' } = process.env;

describe('@wuzzle/cli - smoke testing', () => {
  it('should work with webpack 4.x', () => {
    if (!minimatch('webpack__4.x', SMOKE_TESTING)) return;

    const fixturePath = path.resolve(projectPath, '__tests__/fixtures/webpack__4.x');
    shelljs.cd(fixturePath);
    const { stderr } = shelljs.exec(`${tsNodeExec} ${wuzzlePath} webpack`);

    expect(stderr).toContain('Wuzzle process mounted');
    expect(shelljs.test('-d', 'dist')).toBeTruthy();
  });

  it('should work with webpack 5.x', () => {
    if (!minimatch('webpack__5.x', SMOKE_TESTING)) return;

    const fixturePath = path.resolve(projectPath, '__tests__/fixtures/webpack__5.x');
    shelljs.cd(fixturePath);
    const { stderr } = shelljs.exec(`${tsNodeExec} ${wuzzlePath} webpack`);

    expect(stderr).toContain('Wuzzle process mounted');
    expect(shelljs.test('-d', 'dist')).toBeTruthy();
  });

  it('should work with react-scripts 3.x', () => {
    if (!minimatch('react-scripts__3.x', SMOKE_TESTING)) return;

    const fixturePath = path.resolve(projectPath, '__tests__/fixtures/react-scripts__3.x');
    shelljs.cd(fixturePath);
    const { stderr } = shelljs.exec(
      `cross-env SKIP_PREFLIGHT_CHECK=true ${tsNodeExec} ${wuzzlePath} react-scripts build`
    );

    expect(stderr).toContain('Wuzzle process mounted');
    expect(shelljs.test('-d', 'build')).toBeTruthy();
  });

  it('should work with electron-webpack 2.x', () => {
    if (!minimatch('electron-webpack__2.x', SMOKE_TESTING)) return;

    const fixturePath = path.resolve(projectPath, '__tests__/fixtures/electron-webpack__2.x');
    shelljs.cd(fixturePath);
    const { stderr } = shelljs.exec(
      `${tsNodeExec} ${wuzzlePath} electron-webpack --progress=false`
    );

    expect(stderr).toContain('Wuzzle process mounted');
    expect(shelljs.test('-d', 'dist')).toBeTruthy();
  });

  it('should work with next 9.x', () => {
    if (!minimatch('next__9.x', SMOKE_TESTING)) return;

    const fixturePath = path.resolve(projectPath, '__tests__/fixtures/next__9.x');
    shelljs.cd(fixturePath);
    const { stderr } = shelljs.exec(`${tsNodeExec} ${wuzzlePath} next build`);

    expect(stderr).toContain('Wuzzle process mounted');
    expect(shelljs.test('-d', '.next')).toBeTruthy();
  });
});
