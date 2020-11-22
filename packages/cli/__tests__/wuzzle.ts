import findUp from 'find-up';
import path from 'path';
import shelljs from 'shelljs';

const projectPath = path.dirname(findUp.sync('package.json', { cwd: __filename })!);
const wuzzleExec =
  `cross-env DEBUG='@wuzzle/cli:applyConfig' cross-env TS_NODE_TYPE_CHECK=false ` +
  `ts-node ${require.resolve('../src/bin/wuzzle')}`;

describe('@wuzzle/cli - wuzzle', () => {
  describe('when working with...', () => {
    let execCommand: string;
    let fixturePath: string;
    let outputDir: string;
    let stdout: string;
    let stderr: string;

    describe('anchor not located', () => {
      beforeAll(() => {
        execCommand = `cross-env WUZZLE_ANCHOR_NAME='inexistent_anchor_name' ${wuzzleExec}`;
        fixturePath = '';
        outputDir = '';
      });
      itExecutes({ exitCode: 1 });
      itPrintsExecMessage(`error: 'inexistent_anchor_name' not located`);
    });

    describe('no command', () => {
      beforeAll(() => {
        execCommand = wuzzleExec;
        fixturePath = '';
        outputDir = '';
      });
      itExecutes({ exitCode: 1 });
      itPrintsExecMessage('error: command name not specified');
    });

    describe('unknown command', () => {
      beforeAll(() => {
        execCommand = `${wuzzleExec} unknown`;
        fixturePath = '';
        outputDir = '';
      });
      itExecutes({ exitCode: 1 });
      itPrintsExecMessage(`error: command 'unknown' not supported`);
    });

    describe('webpack 5.x', () => {
      beforeAll(() => {
        execCommand = `${wuzzleExec} webpack`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/webpack__5.x');
        outputDir = 'dist';
      });
      itExecutes();
      itMountsWuzzleProcess();
      itCreatesOutputDir();
    });

    describe('webpack 4.x', () => {
      beforeAll(() => {
        execCommand = `${wuzzleExec} webpack`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/webpack__4.x');
        outputDir = 'dist';
      });
      itExecutes();
      itMountsWuzzleProcess();
      itCreatesOutputDir();
    });

    describe('react-scripts 3.x', () => {
      beforeAll(() => {
        execCommand = `cross-env SKIP_PREFLIGHT_CHECK=true ${wuzzleExec} react-scripts build`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/react-scripts__3.x');
        outputDir = 'build';
      });
      itExecutes();
      itMountsWuzzleProcess();
      itCreatesOutputDir();
    });

    describe('electron-webpack 2.x', () => {
      beforeAll(() => {
        execCommand = `${wuzzleExec} electron-webpack --progress=false`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/electron-webpack__2.x');
        outputDir = 'dist';
      });
      itExecutes();
      itMountsWuzzleProcess();
      itCreatesOutputDir();
    });

    describe('next 9.x', () => {
      beforeAll(() => {
        execCommand = `${wuzzleExec} next build`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/next__9.x');
        outputDir = '.next';
      });
      itExecutes();
      itMountsWuzzleProcess();
      itCreatesOutputDir();
    });

    describe('transpile', () => {
      beforeAll(() => {
        execCommand = `${wuzzleExec} transpile 'src/**/*.js' -d lib`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/wuzzle-transpile');
        outputDir = 'lib';
      });
      itExecutes();
      itMountsWuzzleProcess();
      itCreatesOutputDir();
    });

    describe('node', () => {
      beforeAll(() => {
        execCommand = `${wuzzleExec} node src/index.js`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/node');
        outputDir = '';
      });
      itExecutes();
      itMountsWuzzleProcess();
      itPrintsExecMessage('Hi, Node');
    });

    describe('node -H', () => {
      beforeAll(() => {
        execCommand = `${wuzzleExec} node -H`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/node');
        outputDir = '';
      });
      itExecutes();
      itPrintsExecMessage('Usage: wuzzle-node [options]');
    });

    describe(`node src/print`, () => {
      beforeAll(() => {
        execCommand = `${wuzzleExec} node src/print`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/node');
        outputDir = '';
      });
      itExecutes({ exitCode: 2 });
      itPrintsExecMessage('Cannot find module');
    });

    describe(`node --ext '...' src/print`, () => {
      beforeAll(() => {
        execCommand = `${wuzzleExec} node --ext '.es' src/print`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/node');
        outputDir = '';
      });
      itExecutes();
      itMountsWuzzleProcess();
      itPrintsExecMessage('Hi, Node');
    });

    describe('node src/throw-error.js', () => {
      beforeAll(() => {
        execCommand = `${wuzzleExec} node src/throw-error.js`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/node');
        outputDir = '';
      });
      itExecutes({ exitCode: 2 });
      itMountsWuzzleProcess();
      itPrintsExecMessage('src/throw-error.js:2');
    });

    describe('mocha 8.x', () => {
      beforeAll(() => {
        execCommand = `${wuzzleExec} mocha src/index.test.js`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/mocha__8.x');
        outputDir = '';
      });
      itExecutes();
      itMountsWuzzleProcess();
      itPrintsExecMessage('contains greetings');
    });

    describe('mocha 7.x', () => {
      beforeAll(() => {
        execCommand = `${wuzzleExec} mocha src/index.test.js`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/mocha__7.x');
        outputDir = '';
      });
      itExecutes();
      itMountsWuzzleProcess();
      itPrintsExecMessage('contains greetings');
    });

    describe('jest 26.x', () => {
      beforeAll(() => {
        execCommand = `${wuzzleExec} jest src/index.test.js`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/jest__26.x');
        outputDir = '';
      });
      itExecutes();
      itMountsWuzzleProcess();
      itPrintsExecMessage('contains greetings');
    });

    describe('jest 25.x', () => {
      beforeAll(() => {
        execCommand = `${wuzzleExec} jest src/index.test.js`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/jest__25.x');
        outputDir = '';
      });
      itExecutes();
      itMountsWuzzleProcess();
      itPrintsExecMessage('contains greetings');
    });

    describe('jest 24.x', () => {
      beforeAll(() => {
        execCommand = `${wuzzleExec} jest src/index.test.js`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/jest__24.x');
        outputDir = '';
      });
      itExecutes();
      itMountsWuzzleProcess();
      itPrintsExecMessage('contains greetings');
    });

    describe.each(['weapp', 'h5'])('taro 3.x build type %s', buildType => {
      beforeAll(() => {
        execCommand = `${wuzzleExec} taro build --type=${buildType}`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/taro__3.x');
        outputDir = 'dist';
      });
      itExecutes();
      itMountsWuzzleProcess();
      itCreatesOutputDir();
    });

    describe('razzle 3.x build', () => {
      beforeAll(() => {
        execCommand = `${wuzzleExec} razzle build`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/razzle__3.x');
        outputDir = 'build';
      });
      itExecutes();
      itMountsWuzzleProcess();
      itCreatesOutputDir();
    });

    // TODO make razzle test work
    // describe('razzle 3.x test', () => {
    //   beforeAll(() => {
    //     execCommand = `${wuzzleExec} razzle test --coverage`;
    //     fixturePath = path.resolve(projectPath, '__tests__/fixtures/razzle__3.x');
    //   });
    //   itExecutes();
    //   itMountsWuzzleProcess();
    //   itPrintsExecMessage('renders without exploding');
    // });

    function itExecutes(options = { exitCode: 0 }) {
      it('executes', () => {
        fixturePath && shelljs.cd(fixturePath);
        outputDir && shelljs.rm('-fr', outputDir);
        const execResult = shelljs.exec(execCommand);
        stdout = execResult.stdout;
        stderr = execResult.stderr;
        expect(execResult.code).toBe(options.exitCode);
      });
    }

    function itMountsWuzzleProcess() {
      it('mounts wuzzle process', () => {
        expect(stderr).toContain('Wuzzle process mounted');
      });
    }

    function itCreatesOutputDir() {
      it('creates output dir', () => {
        expect(shelljs.test('-d', outputDir)).toBe(true);
      });
    }

    function itPrintsExecMessage(text: string) {
      it(`prints exec message '${text.substring(0, 7)}...'`, () => {
        expect(stdout + stderr).toContain(text);
      });
    }
  });
});
