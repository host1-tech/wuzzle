import shelljs from 'shelljs';
import path from 'path';
import findUp from 'find-up';
import minimatch from 'minimatch';

const packageJsonPath = findUp.sync('package.json', { cwd: __filename }) || '';
const projectPath = path.dirname(packageJsonPath);
const wuzzlePath = require.resolve('../src/bin/wuzzle');
const tsNodeExec = `cross-env DEBUG='@wuzzle/cli:applyConfig' cross-env TS_NODE_TYPE_CHECK=false ts-node`;

const { SMOKE_TESTING = '' } = process.env;

describe('@wuzzle/cli - smoke testing', () => {
  it('works with webpack 4.x', () => {
    if (!minimatch('webpack__4.x', SMOKE_TESTING)) return;

    const fixturePath = path.resolve(projectPath, '__tests__/fixtures/webpack__4.x');
    shelljs.cd(fixturePath);
    shelljs.rm('-fr', 'dist');

    const { stderr } = shelljs.exec(`${tsNodeExec} ${wuzzlePath} webpack`, {
      silent: true,
    });

    expect(stderr).toContain('Wuzzle process mounted');
    expect(shelljs.test('-d', 'dist')).toBe(true);
  });

  it('works with webpack 5.x', () => {
    if (!minimatch('webpack__5.x', SMOKE_TESTING)) return;

    const fixturePath = path.resolve(projectPath, '__tests__/fixtures/webpack__5.x');
    shelljs.cd(fixturePath);
    shelljs.rm('-fr', 'dist');

    const { stderr } = shelljs.exec(`${tsNodeExec} ${wuzzlePath} webpack`, {
      silent: true,
    });

    expect(stderr).toContain('Wuzzle process mounted');
    expect(shelljs.test('-d', 'dist')).toBe(true);
  });

  it('works with react-scripts 3.x', () => {
    if (!minimatch('react-scripts__3.x', SMOKE_TESTING)) return;

    const fixturePath = path.resolve(projectPath, '__tests__/fixtures/react-scripts__3.x');
    shelljs.cd(fixturePath);
    shelljs.rm('-fr', 'build');

    const { stderr } = shelljs.exec(
      `cross-env SKIP_PREFLIGHT_CHECK=true ${tsNodeExec} ${wuzzlePath} react-scripts build`,
      {
        silent: true,
      }
    );

    expect(stderr).toContain('Wuzzle process mounted');
    expect(shelljs.test('-d', 'build')).toBe(true);
  });

  it('works with electron-webpack 2.x', () => {
    if (!minimatch('electron-webpack__2.x', SMOKE_TESTING)) return;

    const fixturePath = path.resolve(projectPath, '__tests__/fixtures/electron-webpack__2.x');
    shelljs.cd(fixturePath);
    shelljs.rm('-fr', 'dist');

    const { stderr } = shelljs.exec(
      `${tsNodeExec} ${wuzzlePath} electron-webpack --progress=false`,
      {
        silent: true,
      }
    );

    expect(stderr).toContain('Wuzzle process mounted');
    expect(shelljs.test('-d', 'dist')).toBe(true);
  });

  it('works with next 9.x', () => {
    if (!minimatch('next__9.x', SMOKE_TESTING)) return;

    const fixturePath = path.resolve(projectPath, '__tests__/fixtures/next__9.x');
    shelljs.cd(fixturePath);
    shelljs.rm('-fr', '.next');

    const { stderr } = shelljs.exec(`${tsNodeExec} ${wuzzlePath} next build`, {
      silent: true,
    });

    expect(stderr).toContain('Wuzzle process mounted');
    expect(shelljs.test('-d', '.next')).toBe(true);
  });

  it('works with built-in transpile', () => {
    if (!minimatch('wuzzle-transpile', SMOKE_TESTING)) return;

    const fixturePath = path.resolve(projectPath, '__tests__/fixtures/wuzzle-transpile');
    shelljs.cd(fixturePath);
    shelljs.rm('-fr', 'lib');

    const { stderr } = shelljs.exec(`${tsNodeExec} ${wuzzlePath} transpile src/**/*.js -d lib`, {
      silent: true,
    });

    expect(stderr).toContain('Wuzzle process mounted');
    expect(shelljs.test('-d', 'lib')).toBe(true);
  });

  it('works with node execution', () => {
    if (!minimatch('node', SMOKE_TESTING)) return;

    const fixturePath = path.resolve(projectPath, '__tests__/fixtures/node');
    shelljs.cd(fixturePath);

    const { stdout, stderr } = shelljs.exec(`${tsNodeExec} ${wuzzlePath} node src/index.js`, {
      silent: true,
    });

    expect(stderr).toContain('Wuzzle process mounted');
    expect(stdout).toContain('Hi, Node.');
  });

  it('works with mocha 8.x', () => {
    if (!minimatch('mocha', SMOKE_TESTING)) return;

    const fixturePath = path.resolve(projectPath, '__tests__/fixtures/mocha__8.x');
    shelljs.cd(fixturePath);

    const { stdout, stderr } = shelljs.exec(`${tsNodeExec} ${wuzzlePath} mocha src/index.test.js`, {
      silent: true,
    });

    expect(stderr).toContain('Wuzzle process mounted');
    expect(stdout).toContain('contains greetings');
  });

  it('works with mocha 7.x', () => {
    if (!minimatch('mocha', SMOKE_TESTING)) return;

    const fixturePath = path.resolve(projectPath, '__tests__/fixtures/mocha__7.x');
    shelljs.cd(fixturePath);

    const { stdout, stderr } = shelljs.exec(`${tsNodeExec} ${wuzzlePath} mocha src/index.test.js`, {
      silent: true,
    });

    expect(stderr).toContain('Wuzzle process mounted');
    expect(stdout).toContain('contains greetings');
  });

  it('works with jest 26.x', () => {
    if (!minimatch('jest', SMOKE_TESTING)) return;

    const fixturePath = path.resolve(projectPath, '__tests__/fixtures/jest__26.x');
    shelljs.cd(fixturePath);

    const { stderr } = shelljs.exec(`${tsNodeExec} ${wuzzlePath} jest src/index.test.js`, {
      silent: true,
    });

    expect(stderr).toContain('Wuzzle process mounted');
    expect(stderr).toContain('contains greetings');
  });

  it('works with jest 24.x', () => {
    if (!minimatch('jest', SMOKE_TESTING)) return;

    const fixturePath = path.resolve(projectPath, '__tests__/fixtures/jest__24.x');
    shelljs.cd(fixturePath);

    const { stderr } = shelljs.exec(`${tsNodeExec} ${wuzzlePath} jest src/index.test.js`, {
      silent: true,
    });

    expect(stderr).toContain('Wuzzle process mounted');
    expect(stderr).toContain('contains greetings');
  });

  it.each(['weapp', 'h5'])('works with taro 3.x build type %s', buildType => {
    if (!minimatch('taro', SMOKE_TESTING)) return;

    const fixturePath = path.resolve(projectPath, '__tests__/fixtures/taro__3.x');
    shelljs.cd(fixturePath);
    shelljs.rm('-fr', 'dist');

    const { stderr } = shelljs.exec(`${tsNodeExec} ${wuzzlePath} taro build --type=${buildType}`, {
      silent: true,
    });

    expect(stderr).toContain('Wuzzle process mounted');
    expect(shelljs.test('-d', 'dist')).toBe(true);
  });

  it('works with razzle 3.x build', () => {
    if (!minimatch('razzle', SMOKE_TESTING)) return;

    const fixturePath = path.resolve(projectPath, '__tests__/fixtures/razzle__3.x');
    shelljs.cd(fixturePath);
    shelljs.rm('-fr', 'build');

    const { stderr } = shelljs.exec(`${tsNodeExec} ${wuzzlePath} razzle build`, {
      silent: true,
    });

    expect(stderr).toContain('Wuzzle process mounted');
    expect(shelljs.test('-d', 'build')).toBe(true);
  });

  it('works with razzle 3.x test', () => {
    if (!minimatch('razzle', SMOKE_TESTING)) return;

    const fixturePath = path.resolve(projectPath, '__tests__/fixtures/razzle__3.x');
    shelljs.cd(fixturePath);

    const { stderr } = shelljs.exec(`${tsNodeExec} ${wuzzlePath} razzle test --coverage`, {
      silent: true,
    });

    expect(stderr).toContain('Wuzzle process mounted');
  });
});
