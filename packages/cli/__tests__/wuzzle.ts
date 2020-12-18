import { EventEmitter } from 'events';
import findUp from 'find-up';
import { merge } from 'lodash';
import path from 'path';
import shelljs from 'shelljs';
import treeKill from 'tree-kill';
import { EK_RPOJECT_ANCHOR } from '../src/constants';

const projectPath = path.dirname(findUp.sync('package.json', { cwd: __filename })!);
const envOptions = `cross-env DEBUG='@wuzzle/cli:applyConfig' cross-env TS_NODE_TYPE_CHECK=false`;
const wuzzleExec = `${envOptions} ts-node ${require.resolve('../src/bin/wuzzle')}`;

describe('@wuzzle/cli - wuzzle', () => {
  describe('when working with...', () => {
    let commandExec: string;
    let fixturePath: string;
    let outputDir: string;
    let stdout: string;
    let stderr: string;

    describe('anchor not located', () => {
      beforeAll(() => {
        commandExec = `cross-env ${EK_RPOJECT_ANCHOR}='inexistent_anchor_name' ${wuzzleExec}`;
        fixturePath = '';
        outputDir = '';
      });
      itExecutes({ exitCode: 1 });
      itPrintsExecMessage(`error: 'inexistent_anchor_name' not located`);
    });

    describe('no command', () => {
      beforeAll(() => {
        commandExec = wuzzleExec;
        fixturePath = '';
        outputDir = '';
      });
      itExecutes({ exitCode: 1 });
      itPrintsExecMessage('error: command name not specified');
    });

    describe('unknown command', () => {
      beforeAll(() => {
        commandExec = `${wuzzleExec} unknown`;
        fixturePath = '';
        outputDir = '';
      });
      itExecutes({ exitCode: 1 });
      itPrintsExecMessage(`error: command 'unknown' not supported`);
    });

    describe.each(['5.x', '4.x'])('webpack %s', version => {
      beforeAll(() => {
        commandExec = `${wuzzleExec} webpack`;
        fixturePath = path.resolve(projectPath, `__tests__/fixtures/webpack__${version}`);
        outputDir = 'dist';
      });
      itExecutes();
      itMountsWuzzleProcess();
      itCreatesOutputDir();
    });

    ['4.x', '3.x'].forEach(version => {
      describe(`react-scripts ${version} build`, () => {
        beforeAll(() => {
          commandExec = `${wuzzleExec} react-scripts build`;
          fixturePath = path.resolve(projectPath, `__tests__/fixtures/react-scripts__${version}`);
          outputDir = 'build';
        });
        itExecutes();
        itMountsWuzzleProcess();
        itCreatesOutputDir();
      });

      describe(`react-scripts ${version} test`, () => {
        beforeAll(() => {
          commandExec = `${wuzzleExec} react-scripts test --watchAll=false`;
          fixturePath = path.resolve(projectPath, `__tests__/fixtures/react-scripts__${version}`);
        });
        itExecutes();
        itMountsWuzzleProcess();
        itPrintsExecMessage('renders without exploding');
      });
    });

    describe('electron-webpack 2.x', () => {
      beforeAll(() => {
        commandExec = `${wuzzleExec} electron-webpack --progress=false`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/electron-webpack__2.x');
        outputDir = 'dist';
      });
      itExecutes();
      itMountsWuzzleProcess();
      itCreatesOutputDir();
    });

    describe('next 9.x', () => {
      beforeAll(() => {
        commandExec = `${wuzzleExec} next build`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/next__9.x');
        outputDir = '.next';
      });
      itExecutes();
      itMountsWuzzleProcess();
      itCreatesOutputDir();
    });

    describe('transpile', () => {
      beforeAll(() => {
        commandExec = `${wuzzleExec} transpile 'src/**/*.js' -d lib`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/wuzzle-transpile');
        outputDir = 'lib';
      });
      itExecutes();
      itMountsWuzzleProcess();
      itCreatesOutputDir();
    });

    describe('node', () => {
      beforeAll(() => {
        commandExec = `${wuzzleExec} node src/index.js`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/node');
        outputDir = '';
      });
      itExecutes();
      itMountsWuzzleProcess();
      itPrintsExecMessage('Hi, Node');
    });

    describe('node -H', () => {
      beforeAll(() => {
        commandExec = `${wuzzleExec} node -H`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/node');
        outputDir = '';
      });
      itExecutes();
      itPrintsExecMessage('Usage: wuzzle-node [options]');
    });

    describe(`node src/print`, () => {
      beforeAll(() => {
        commandExec = `${wuzzleExec} node src/print`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/node');
        outputDir = '';
      });
      itExecutes({ exitCode: 1 });
      itPrintsExecMessage('Cannot find module');
    });

    describe(`node --ext '...' src/print`, () => {
      beforeAll(() => {
        commandExec = `${wuzzleExec} node --ext '.es' src/print`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/node');
        outputDir = '';
      });
      itExecutes();
      itMountsWuzzleProcess();
      itPrintsExecMessage('Hi, Node');
    });

    describe('node src/throw-error.js', () => {
      beforeAll(() => {
        commandExec = `${wuzzleExec} node src/throw-error.js`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/node');
        outputDir = '';
      });
      itExecutes({ exitCode: 1 });
      itMountsWuzzleProcess();
      itPrintsExecMessage('src/throw-error.js:2');
    });

    describe.each(['8.x', '7.x'])('mocha %s', version => {
      beforeAll(() => {
        commandExec = `${wuzzleExec} mocha src/index.test.js`;
        fixturePath = path.resolve(projectPath, `__tests__/fixtures/mocha__${version}`);
        outputDir = '';
      });
      itExecutes();
      itMountsWuzzleProcess();
      itPrintsExecMessage('contains greetings');
    });

    describe('mocha 8.x coverage', () => {
      beforeAll(() => {
        commandExec = `nyc -n '**/*.js' ${wuzzleExec} mocha src/index.test.js`;
        fixturePath = path.resolve(projectPath, `__tests__/fixtures/mocha__8.x`);
        outputDir = '';
      });
      itExecutes();
      itMountsWuzzleProcess();
      itPrintsExecMessage('contains greetings');
      itReportsCoverageProperly();
    });

    describe.each(['26.x', '25.x', '24.x'])('jest %s', version => {
      beforeAll(() => {
        commandExec = `${wuzzleExec} jest`;
        fixturePath = path.resolve(projectPath, `__tests__/fixtures/jest__${version}`);
        outputDir = '';
      });
      itExecutes();
      itMountsWuzzleProcess();
      itPrintsExecMessage('contains greetings');
    });

    describe('jest 26.x coverage', () => {
      beforeAll(() => {
        commandExec = `${wuzzleExec} jest --coverage`;
        fixturePath = path.resolve(projectPath, `__tests__/fixtures/jest__26.x`);
        outputDir = '';
      });
      itExecutes();
      itMountsWuzzleProcess();
      itPrintsExecMessage('contains greetings');
      itReportsCoverageProperly();
    });

    describe('jest 26.x -H', () => {
      beforeAll(() => {
        commandExec = `${wuzzleExec} jest -H`;
        fixturePath = path.resolve(projectPath, `__tests__/fixtures/jest__26.x`);
        outputDir = '';
      });
      itExecutes();
      itPrintsExecMessage('Usage: wuzzle-jest [options]');
    });

    describe('jest 26.x --inspect', () => {
      beforeAll(() => {
        commandExec = `${wuzzleExec} jest --inspect`;
        fixturePath = path.resolve(projectPath, `__tests__/fixtures/jest__26.x`);
        outputDir = '';
      });
      itExecutes();
      itMountsWuzzleProcess();
      itPrintsExecMessage('Debugger listening on ws://');
    });

    describe('jest 26.x --inspect=9933', () => {
      beforeAll(() => {
        commandExec = `${wuzzleExec} jest --inspect 9933`;
        fixturePath = path.resolve(projectPath, `__tests__/fixtures/jest__26.x`);
        outputDir = '';
      });
      itExecutes();
      itMountsWuzzleProcess();
      itPrintsExecMessage('Debugger listening on ws://127.0.0.1:9933');
    });

    describe('jest 26.x --inspect-brk', () => {
      beforeAll(() => {
        commandExec = `${wuzzleExec} jest --inspect-brk`;
        fixturePath = path.resolve(projectPath, `__tests__/fixtures/jest__26.x`);
        outputDir = '';
      });
      itExecutes({ closeMsg: 'Debugger' });
      itPrintsExecMessage('Debugger listening on ws://');
    });

    describe('jest 26.x --inspect-brk=9933', () => {
      beforeAll(() => {
        commandExec = `${wuzzleExec} jest --inspect-brk=9933`;
        fixturePath = path.resolve(projectPath, `__tests__/fixtures/jest__26.x`);
        outputDir = '';
      });
      itExecutes({ closeMsg: 'Debugger' });
      itPrintsExecMessage('Debugger listening on ws://127.0.0.1:9933');
    });

    describe.each(['weapp', 'h5'])('taro 3.x build type %s', buildType => {
      beforeAll(() => {
        commandExec = `${wuzzleExec} taro build --type=${buildType}`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/taro__3.x');
        outputDir = 'dist';
      });
      itExecutes();
      itMountsWuzzleProcess();
      itCreatesOutputDir();
    });

    describe('razzle 3.x build', () => {
      beforeAll(() => {
        commandExec = `${wuzzleExec} razzle build`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/razzle__3.x');
        outputDir = 'build';
      });
      itExecutes();
      itMountsWuzzleProcess();
      itCreatesOutputDir();
    });

    describe('razzle 3.x test', () => {
      beforeAll(() => {
        commandExec = `${wuzzleExec} razzle test --coverage --env=jsdom`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/razzle__3.x');
      });
      itExecutes();
      itMountsWuzzleProcess();
      itPrintsExecMessage('renders without exploding');
    });

    describe('storybook 6.x start', () => {
      beforeAll(() => {
        commandExec = `${wuzzleExec} start-storybook --quiet --ci`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/storybook__6.x');
        outputDir = '';
      });
      itExecutes({ closeMsg: 'webpack built' });
      itMountsWuzzleProcess();
    });

    describe('storybook 6.x build', () => {
      beforeAll(() => {
        commandExec = `${wuzzleExec} build-storybook --quiet`;
        fixturePath = path.resolve(projectPath, '__tests__/fixtures/storybook__6.x');
        outputDir = 'storybook-static';
      });
      itExecutes();
      itMountsWuzzleProcess();
      itCreatesOutputDir();
    });

    function itExecutes(options: Partial<{ exitCode: number; closeMsg: string }> = {}) {
      options = merge({ exitCode: 0 }, options);

      it('executes', async () => {
        fixturePath && shelljs.cd(fixturePath);
        outputDir && shelljs.rm('-fr', outputDir);

        const commandProc = shelljs.exec(commandExec, { async: true });
        const [_stdout, _stderr] = await new Promise(resolve => {
          const stdoutLines: string[] = [];
          const stdout = commandProc.stdout!;

          const stderrLines: string[] = [];
          const stderr = commandProc.stderr!;

          handleStdData(stdout, stdoutLines);
          handleStdData(stderr, stderrLines);

          function handleStdData(
            stream: EventEmitter & NodeJS.ReadableStream,
            streamLines: string[]
          ) {
            stream.on('data', function onData(streamLine) {
              streamLines.push(streamLine);
              if (options.closeMsg && streamLine.includes(options.closeMsg)) {
                treeKill(commandProc.pid, 'SIGKILL');
              }
            });
          }

          commandProc.on('exit', () => resolve([stdoutLines.join(''), stderrLines.join('')]));
        });

        stdout = _stdout;
        stderr = _stderr;
        if (typeof commandProc.exitCode == 'number') {
          expect(commandProc.exitCode).toBe(options.exitCode);
        }
      }, 60000);
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

    function itReportsCoverageProperly() {
      it('reports coverage properly', () => {
        expect(stdout).not.toContain('webpack');
        expect(stdout).toMatch(/index.js.+\d+.+\d+.+\d+.+\d+/);
      });
    }
  });
});
