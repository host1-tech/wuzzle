import { ChildProcess } from 'child_process';
import findUp from 'find-up';
import fs from 'fs';
import path from 'path';
import shelljs from 'shelljs';
import treeKill from 'tree-kill';

const projectPath = path.dirname(findUp.sync('package.json', { cwd: __filename })!);
const fixturePath = path.resolve(projectPath, '__tests__/fixtures/wuzzle-transpile-bin');
const envOptions = `cross-env TS_NODE_TYPE_CHECK=false`;
const wuzzleTranspileExec = `${envOptions} ts-node ${require.resolve(
  '../src/bin/wuzzle-transpile'
)}`;

const inputTempFile = 'src/temp.js';

describe('@wuzzle/cli - wuzzle-transpile', () => {
  beforeAll(() => shelljs.cd(fixturePath));

  describe('when executing with help option', () => {
    it.each(['-h', '--help'])(`prints help info with '%s'`, option => {
      const { stdout } = shelljs.exec(`${wuzzleTranspileExec} ${option}`);
      expect(stdout).toContain('Usage: wuzzle-transpile [options] <globs...>');
    });
  });

  describe('when executing with input absence', () => {
    it('prints error message with no input', () => {
      const { stderr } = shelljs.exec(wuzzleTranspileExec);
      expect(stderr).toContain(`error: required option '-d, --out-dir <dir>' not specified`);
    });

    it('prints error message with input globs only', () => {
      const { stderr } = shelljs.exec(`${wuzzleTranspileExec} 'src/**/*.js'`);
      expect(stderr).toContain(`error: required option '-d, --out-dir <dir>' not specified`);
    });

    it.each(['-d', '--out-dir'])(`prints error message with '%s' only`, option => {
      const { stderr } = shelljs.exec(`${wuzzleTranspileExec} ${option} lib`);
      expect(stderr).toContain('error: input globs not specified');
    });
  });

  describe('when executing with no input file found', () => {
    it('prints hint message', () => {
      const { stdout } = shelljs.exec(`${wuzzleTranspileExec} 'inexistent/input/glob' -d lib`);
      expect(stdout).toContain('No input file found');
    });
  });

  describe('when executing with bad input file', () => {
    it('prints hint message', () => {
      const { stdout } = shelljs.exec(`${wuzzleTranspileExec} 'src/throw.es' -d lib`);
      expect(stdout).toContain('compilation failed');
    });
  });

  describe('when executing with unsupported option', () => {
    it.each(['-t', '--target'])(`prints error message with '%s unknown'`, option => {
      const { stderr } = shelljs.exec(
        `${wuzzleTranspileExec} 'src/**/*.js' -d lib ${option} unknown `
      );
      expect(stderr).toContain(`error: option '-t, --target unknown' not supported.`);
    });

    it.each(['-s', '--source-map'])(`prints error message with '%s unknown'`, option => {
      const { stderr } = shelljs.exec(
        `${wuzzleTranspileExec} 'src/**/*.js' -d lib ${option} unknown `
      );
      expect(stderr).toContain(`error: option '-s, --source-map unknown' not supported.`);
    });
  });

  describe('when executing with ...', () => {
    let inputGlobs: string;
    let inputFiles: string[];
    let outputDir: string;
    let outputFiles: string[];
    let outputTempFile: string;
    let commandExec: string;
    let commandProc: ChildProcess;
    let stdout: string;

    describe(`'src/**/*.js' -d lib`, () => {
      beforeAll(() => {
        inputGlobs = 'src/**/*.js';
        inputFiles = ['src/index.js', 'src/constants/index.js'];
        outputDir = 'lib';
        outputFiles = ['lib/index.js', 'lib/constants/index.js'];
        commandExec = `${wuzzleTranspileExec} '${inputGlobs}' -d ${outputDir}`;
      });

      itExecutesAndCreatesOutputFiles();
      itPrintsProgressDetails();
      itOutputsDevFiles();
      itDoesNotCreateSourceMapFiles();
      itDoesNotCreateInlineSourceMaps();
    });

    describe(`'**/*.js' -d lib`, () => {
      beforeAll(() => {
        inputGlobs = '**/*.js';
        inputFiles = ['src/index.js', 'src/constants/index.js'];
        outputDir = 'lib';
        outputFiles = ['lib/index.js', 'lib/constants/index.js'];
        commandExec = `${wuzzleTranspileExec} '${inputGlobs}' -d ${outputDir}`;
      });

      itExecutesAndCreatesOutputFiles();
      itPrintsProgressDetails();
      itOutputsDevFiles();
      itDoesNotCreateSourceMapFiles();
      itDoesNotCreateInlineSourceMaps();
    });

    describe(`'src/constants/**/*.js' -d lib`, () => {
      beforeAll(() => {
        inputGlobs = 'src/constants/**/*.js';
        inputFiles = ['src/constants/index.js'];
        outputDir = 'lib';
        outputFiles = ['lib/index.js'];
        commandExec = `${wuzzleTranspileExec} '${inputGlobs}' -d ${outputDir}`;
      });

      itExecutesAndCreatesOutputFiles();
      itPrintsProgressDetails();
      itOutputsDevFiles();
      itDoesNotCreateSourceMapFiles();
      itDoesNotCreateInlineSourceMaps();
    });

    describe(`'src/constants/**/*.js' -d lib -b src`, () => {
      beforeAll(() => {
        inputGlobs = 'src/constants/**/*.js';
        inputFiles = ['src/constants/index.js'];
        outputDir = 'lib';
        outputFiles = ['lib/constants/index.js'];
        commandExec = `${wuzzleTranspileExec} '${inputGlobs}' -d ${outputDir} -b src`;
      });

      itExecutesAndCreatesOutputFiles();
      itPrintsProgressDetails();
      itOutputsDevFiles();
      itDoesNotCreateSourceMapFiles();
      itDoesNotCreateInlineSourceMaps();
    });

    describe(`'src/**/*.js' -d lib --ignore 'src/constants/**/*.js'`, () => {
      beforeAll(() => {
        inputGlobs = 'src/**/*.js';
        inputFiles = ['src/index.js'];
        outputDir = 'lib';
        outputFiles = ['lib/index.js'];
        commandExec = `${wuzzleTranspileExec} '${inputGlobs}' -d ${outputDir} --ignore 'src/constants/**/*.js'`;
      });

      itExecutesAndCreatesOutputFiles();
      itPrintsProgressDetails();
      itOutputsDevFiles();
      itDoesNotCreateSourceMapFiles();
      itDoesNotCreateInlineSourceMaps();
    });

    describe(`'src/**/*.js' -d out -p`, () => {
      beforeAll(() => {
        inputGlobs = 'src/**/*.js';
        inputFiles = ['src/index.js', 'src/constants/index.js'];
        outputDir = 'lib';
        outputFiles = ['lib/index.js', 'lib/constants/index.js'];
        commandExec = `${wuzzleTranspileExec} '${inputGlobs}' -d ${outputDir} -p`;
      });

      itExecutesAndCreatesOutputFiles();
      itPrintsProgressDetails();
      itOutputsProdFiles();
      itDoesNotCreateSourceMapFiles();
      itDoesNotCreateInlineSourceMaps();
    });

    describe(`'src/**/*.js' -d lib -s`, () => {
      beforeAll(() => {
        inputGlobs = 'src/**/*.js';
        inputFiles = ['src/index.js', 'src/constants/index.js'];
        outputDir = 'lib';
        outputFiles = [
          'lib/index.js',
          'lib/index.js.map',
          'lib/constants/index.js',
          'lib/constants/index.js.map',
        ];
        commandExec = `${wuzzleTranspileExec} '${inputGlobs}' -d ${outputDir} -s`;
      });

      itExecutesAndCreatesOutputFiles();
      itPrintsProgressDetails();
      itOutputsDevFiles();
      itDoesNotCreateInlineSourceMaps();
    });

    describe(`'src/**/*.js' -d lib -s inline`, () => {
      beforeAll(() => {
        inputGlobs = 'src/**/*.js';
        inputFiles = ['src/index.js', 'src/constants/index.js'];
        outputDir = 'lib';
        outputFiles = ['lib/index.js', 'lib/constants/index.js'];
        commandExec = `${wuzzleTranspileExec} '${inputGlobs}' -d ${outputDir} -s inline`;
      });

      itExecutesAndCreatesOutputFiles();
      itPrintsProgressDetails();
      itOutputsDevFiles();
      itDoesNotCreateSourceMapFiles();
      itCreatesInlineSourceMaps();
    });

    describe(`'src/**/*.js' -d lib -p -s`, () => {
      beforeAll(() => {
        inputGlobs = 'src/**/*.js';
        inputFiles = ['src/index.js', 'src/constants/index.js'];
        outputDir = 'lib';
        outputFiles = [
          'lib/index.js',
          'lib/index.js.map',
          'lib/constants/index.js',
          'lib/constants/index.js.map',
        ];
        commandExec = `${wuzzleTranspileExec} '${inputGlobs}' -d ${outputDir} -p -s`;
      });

      itExecutesAndCreatesOutputFiles();
      itPrintsProgressDetails();
      itOutputsProdFiles();
      itDoesNotCreateInlineSourceMaps();
    });

    describe(`'src/**/*.js' -d lib -p -s inline`, () => {
      beforeAll(() => {
        inputGlobs = 'src/**/*.js';
        inputFiles = ['src/index.js', 'src/constants/index.js'];
        outputDir = 'lib';
        outputFiles = ['lib/index.js', 'lib/constants/index.js'];
        commandExec = `${wuzzleTranspileExec} '${inputGlobs}' -d ${outputDir} -p -s inline`;
      });

      itExecutesAndCreatesOutputFiles();
      itPrintsProgressDetails();
      itOutputsProdFiles();
      itDoesNotCreateSourceMapFiles();
      itCreatesInlineSourceMaps();
    });

    describe(`'src/**/*.js' -d lib -V`, () => {
      beforeAll(() => {
        inputGlobs = 'src/**/*.js';
        inputFiles = ['src/index.js', 'src/constants/index.js'];
        outputDir = 'lib';
        outputFiles = ['lib/index.js', 'lib/constants/index.js'];
        commandExec = `${wuzzleTranspileExec} '${inputGlobs}' -d ${outputDir} -V`;
      });

      itExecutesAndCreatesOutputFiles();
      itPrintsProgressDetails();
      itPrintsCleanMessage();
      itOutputsDevFiles();
      itDoesNotCreateSourceMapFiles();
      itDoesNotCreateInlineSourceMaps();
    });

    describe(`'src/**/*.js' -d lib -w -V`, () => {
      beforeAll(async () => {
        inputGlobs = 'src/**/*.js';
        inputFiles = ['src/index.js', 'src/constants/index.js'];
        outputDir = 'lib';
        outputFiles = ['lib/index.js', 'lib/constants/index.js'];
        outputTempFile = 'lib/temp.js';
        commandExec = `${wuzzleTranspileExec} '${inputGlobs}' -d ${outputDir} -w -V`;
      });

      afterAll(() => {
        treeKill(commandProc.pid, 'SIGINT');
      });

      itExecutesAndCreatesOutputFiles();
      itPrintsProgressDetails();
      itPrintsWatchMessage();
      itOutputsDevFiles();
      itDoesNotCreateSourceMapFiles();
      itDoesNotCreateInlineSourceMaps();
      itCreatesOutputFileOnInputFileCreated();
      itUpdatesOutputFileOnInputFileUpdated();
      itRemovesOutputFileOnInputFileRemoved();
    });

    function itExecutesAndCreatesOutputFiles() {
      it('executes and creates output files', async () => {
        shelljs.rm('-fr', outputDir, inputTempFile);

        commandProc = shelljs.exec(commandExec, { async: true });
        stdout = await new Promise(resolve => {
          let isResolved = false;
          const outputLines: string[] = [];
          const stdout = commandProc.stdout!;

          stdout.on('data', function onData(outputLine) {
            outputLines.push(outputLine);
            if (outputLine.includes('Start watching')) {
              stdout.off('data', onData);
              resolveOutput();
            }
          });
          stdout.on('end', resolveOutput);

          function resolveOutput() {
            if (isResolved) return;
            isResolved = true;
            resolve(outputLines.join(''));
          }
        });

        const outputFilesCount = shelljs
          .ls('-R', outputDir)
          .filter(file => shelljs.test('-f', path.resolve(outputDir, file))).length;

        expect(outputFilesCount).toBe(outputFiles.length);

        outputFiles.forEach(outputFile => {
          expect(shelljs.test('-f', outputFile)).toBe(true);
        });
      }, 45000);
    }

    function itPrintsProgressDetails() {
      it('prints progress details', () => {
        expect(stdout).toContain(`Start compiling '${inputGlobs}'`);
        inputFiles.forEach(inputFile => {
          expect(stdout).toContain(`File '${path.normalize(inputFile)}' compiled`);
        });
        expect(stdout).toContain('All files compiled');
      });
    }

    function itPrintsCleanMessage() {
      it('prints clean message', () => {
        expect(stdout).toContain(`Directory '${outputDir}' cleaned`);
      });
    }

    function itPrintsWatchMessage() {
      it('prints watch message', () => {
        expect(stdout).toContain(`Start watching '${inputGlobs}'`);
      });
    }

    function itOutputsDevFiles() {
      it('it outputs dev files', () => {
        outputFiles
          .filter(outputFile => outputFile.endsWith('.js'))
          .forEach(outputFile => {
            expect(shelljs.cat(outputFile).stdout).toContain('__webpack_require__');
          });
      });
    }

    function itOutputsProdFiles() {
      it('it outputs prod files', () => {
        outputFiles
          .filter(outputFile => outputFile.endsWith('.js'))
          .forEach(outputFile => {
            expect(shelljs.cat(outputFile).stdout).not.toContain('__webpack_require__');
          });
      });
    }

    function itDoesNotCreateSourceMapFiles() {
      it('does not create source map files', () => {
        outputFiles.forEach(outputFile => {
          expect(shelljs.test('-f', `${outputFile}.map`)).toBe(false);
        });
      });
    }

    function itCreatesInlineSourceMaps() {
      it('it creates inline source maps', () => {
        outputFiles.forEach(outputFile => {
          expect(shelljs.cat(outputFile).stdout).toContain(
            'sourceMappingURL=data:application/json;charset=utf-8;base64'
          );
        });
      });
    }

    function itDoesNotCreateInlineSourceMaps() {
      it('it does not create inline source maps', () => {
        outputFiles.forEach(outputFile => {
          expect(shelljs.cat(outputFile).stdout).not.toContain(
            'sourceMappingURL=data:application/json;charset=utf-8;base64'
          );
        });
      });
    }

    function itCreatesOutputFileOnInputFileCreated() {
      it('creates output file on input file created', async () => {
        const stdout = commandProc.stdout!;
        const stdoutLine = await new Promise(resolve => {
          stdout.on('data', function onData(outputLine) {
            stdout.off('data', onData);
            resolve(outputLine);
          });
          shelljs.touch(inputTempFile);
        });
        expect(stdoutLine).toContain(`File '${path.normalize(inputTempFile)}' compiled`);
        expect(shelljs.test('-f', outputTempFile)).toBe(true);
      }, 15000);
    }

    function itUpdatesOutputFileOnInputFileUpdated() {
      it('updates output file on input file updated', async () => {
        const newContent = 'console.log()';
        const stdout = commandProc.stdout!;
        const stdoutLine = await new Promise(resolve => {
          stdout.on('data', function onData(outputLine) {
            stdout.off('data', onData);
            resolve(outputLine);
          });
          fs.writeFileSync(inputTempFile, newContent);
        });
        expect(stdoutLine).toContain(`File '${path.normalize(inputTempFile)}' recompiled`);
        expect(shelljs.cat(outputTempFile).stdout).toContain(newContent);
      }, 15000);
    }

    function itRemovesOutputFileOnInputFileRemoved() {
      it('removes output file on input file removed', async () => {
        const stdout = commandProc.stdout!;
        const stdoutLine = await new Promise(resolve => {
          stdout.on('data', function onData(outputLine) {
            stdout.off('data', onData);
            resolve(outputLine);
          });
          shelljs.rm('-f', inputTempFile);
        });
        expect(stdoutLine).toContain(`File '${path.normalize(inputTempFile)}' removed`);
        expect(shelljs.test('-f', outputTempFile)).toBe(false);
      }, 15000);
    }
  });
});
