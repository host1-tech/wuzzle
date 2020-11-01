import { ChildProcess } from 'child_process';
import findUp from 'find-up';
import fs from 'fs';
import path from 'path';
import shelljs from 'shelljs';

const packageJsonPath = findUp.sync('package.json', { cwd: __filename })!;
const projectPath = path.dirname(packageJsonPath);
const fixturePath = path.resolve(projectPath, '__tests__/fixtures/wuzzle-transpile');
const wuzzleTranspilePath = require.resolve('./wuzzle-transpile');

const tsNodeExec = `cross-env DEBUG='@wuzzle/cli:applyConfig' cross-env TS_NODE_TYPE_CHECK=false ts-node`;

describe('src/bin/wuzzle-transpile', () => {
  beforeAll(() => shelljs.cd(fixturePath));

  describe('when executing with help option', () => {
    it.each(['-h', '--help'])(`prints help info with '%s'`, option => {
      const { stdout } = shelljs.exec(`${tsNodeExec} ${wuzzleTranspilePath} ${option}`, {
        silent: true,
      });
      expect(stdout).toContain('Usage: wuzzle-transpile [options] <globs...>');
    });
  });

  describe('when executing with input absence', () => {
    it(`prints error message with no input`, () => {
      const { stderr } = shelljs.exec(`${tsNodeExec} ${wuzzleTranspilePath}`, { silent: true });
      expect(stderr).toContain(`error: required option '-d, --out-dir <dir>' not specified`);
    });

    it(`prints error message with input globs only`, () => {
      const { stderr } = shelljs.exec(`${tsNodeExec} ${wuzzleTranspilePath} 'src/**/*.js'`, {
        silent: true,
      });
      expect(stderr).toContain(`error: required option '-d, --out-dir <dir>' not specified`);
    });

    it.each(['-d', '--out-dir'])(`prints error message with '%s' only`, option => {
      const { stderr } = shelljs.exec(`${tsNodeExec} ${wuzzleTranspilePath} ${option} out`, {
        silent: true,
      });
      expect(stderr).toContain('error: input globs not specified');
    });
  });

  describe('when executing with ...', () => {
    let inputGlobs: string;
    let inputFiles: string[];
    let inputTempFile: string;
    let outputDir: string;
    let outputFiles: string[];
    let outputTempFile: string;
    let commandExec: string;
    let commandProc: ChildProcess;
    let stdout: string;

    describe(`'src/**/*.js' -d out`, () => {
      beforeAll(() => {
        inputGlobs = 'src/**/*.js';
        inputFiles = ['src/index.js', 'src/constants/index.js'];
        outputDir = 'lib';
        outputFiles = ['lib/index.js', 'lib/constants/index.js'];
        commandExec = `${tsNodeExec} ${wuzzleTranspilePath} '${inputGlobs}' -d ${outputDir}`;
        shelljs.rm('-fr', outputDir);
        stdout = shelljs.exec(commandExec, { silent: true }).stdout;
      });

      itCreatesOutputDir();
      itKeepsDirStructure();
      itPrintsProgressDetails();
      itOutputsDevFiles();
      itDoesNotCreateSourceMapFiles();
      itDoesNotCreateInlineSourceMaps();
    });

    describe(`'**/*.js' -d out`, () => {
      beforeAll(() => {
        inputGlobs = '**/*.js';
        inputFiles = ['src/index.js', 'src/constants/index.js'];
        outputDir = 'lib';
        outputFiles = ['lib/index.js', 'lib/constants/index.js'];
        commandExec = `${tsNodeExec} ${wuzzleTranspilePath} '${inputGlobs}' -d ${outputDir}`;
        shelljs.rm('-fr', outputDir);
        stdout = shelljs.exec(commandExec, { silent: true }).stdout;
      });

      itCreatesOutputDir();
      itKeepsDirStructure();
      itPrintsProgressDetails();
      itOutputsDevFiles();
      itDoesNotCreateSourceMapFiles();
      itDoesNotCreateInlineSourceMaps();
      itIgnoresDirNodeModules();
    });

    describe(`'src/constants/**/*.js' -d out`, () => {
      beforeAll(() => {
        inputGlobs = '**/*.js';
        inputFiles = ['src/constants/index.js'];
        outputDir = 'lib';
        outputFiles = ['lib/index.js'];
        commandExec = `${tsNodeExec} ${wuzzleTranspilePath} '${inputGlobs}' -d ${outputDir}`;
        shelljs.rm('-fr', outputDir);
        stdout = shelljs.exec(commandExec, { silent: true }).stdout;
      });

      itCreatesOutputDir();
      itKeepsDirStructure();
      itPrintsProgressDetails();
      itOutputsDevFiles();
      itDoesNotCreateSourceMapFiles();
      itDoesNotCreateInlineSourceMaps();
    });

    describe(`'src/constants/**/*.js' -d out -b src`, () => {
      beforeAll(() => {
        inputGlobs = '**/*.js';
        inputFiles = ['src/constants/index.js'];
        outputDir = 'lib';
        outputFiles = ['lib/constants/index.js'];
        commandExec = `${tsNodeExec} ${wuzzleTranspilePath} '${inputGlobs}' -d ${outputDir} -b src`;
        shelljs.rm('-fr', outputDir);
        stdout = shelljs.exec(commandExec, { silent: true }).stdout;
      });

      itCreatesOutputDir();
      itKeepsDirStructure();
      itPrintsProgressDetails();
      itOutputsDevFiles();
      itDoesNotCreateSourceMapFiles();
      itDoesNotCreateInlineSourceMaps();
    });

    describe(`'src/**/*.js' -d out --ignore 'src/constants/**/*.js'`, () => {
      beforeAll(() => {
        inputGlobs = 'src/**/*.js';
        inputFiles = ['src/index.js'];
        outputDir = 'lib';
        outputFiles = ['lib/index.js'];
        commandExec =
          `${tsNodeExec} ${wuzzleTranspilePath} '${inputGlobs}' -d ${outputDir} ` +
          `--ignore 'src/constants/**/*.js'`;
        shelljs.rm('-fr', outputDir);
        stdout = shelljs.exec(commandExec, { silent: true }).stdout;
      });

      itCreatesOutputDir();
      itKeepsDirStructure();
      itPrintsProgressDetails();
      itOutputsDevFiles();
      itDoesNotCreateSourceMapFiles();
      itDoesNotCreateInlineSourceMaps();
      itIgnoresDirSrcConstants();
    });

    describe(`'src/**/*.js' -d out -p`, () => {
      beforeAll(() => {
        inputGlobs = 'src/**/*.js';
        inputFiles = ['src/index.js', 'src/constants/index.js'];
        outputDir = 'lib';
        outputFiles = ['lib/index.js', 'lib/constants/index.js'];
        commandExec = `${tsNodeExec} ${wuzzleTranspilePath} '${inputGlobs}' -d ${outputDir} -p`;
        shelljs.rm('-fr', outputDir);
        stdout = shelljs.exec(commandExec, { silent: true }).stdout;
      });

      itCreatesOutputDir();
      itKeepsDirStructure();
      itPrintsProgressDetails();
      itOutputsProdFiles();
      itDoesNotCreateSourceMapFiles();
      itDoesNotCreateInlineSourceMaps();
    });

    describe(`'src/**/*.js' -d out -s`, () => {
      beforeAll(() => {
        inputGlobs = 'src/**/*.js';
        inputFiles = ['src/index.js', 'src/constants/index.js'];
        outputDir = 'lib';
        outputFiles = ['lib/index.js', 'lib/constants/index.js'];
        commandExec = `${tsNodeExec} ${wuzzleTranspilePath} '${inputGlobs}' -d ${outputDir} -s`;
        shelljs.rm('-fr', outputDir);
        stdout = shelljs.exec(commandExec, { silent: true }).stdout;
      });

      itCreatesOutputDir();
      itKeepsDirStructure();
      itPrintsProgressDetails();
      itOutputsDevFiles();
      itCreatesSourceMapFiles();
      itDoesNotCreateInlineSourceMaps();
    });

    describe(`'src/**/*.js' -d out -s inline`, () => {
      beforeAll(() => {
        inputGlobs = 'src/**/*.js';
        inputFiles = ['src/index.js', 'src/constants/index.js'];
        outputDir = 'lib';
        outputFiles = ['lib/index.js', 'lib/constants/index.js'];
        commandExec = `${tsNodeExec} ${wuzzleTranspilePath} '${inputGlobs}' -d ${outputDir} -s inline`;
        shelljs.rm('-fr', outputDir);
        stdout = shelljs.exec(commandExec, { silent: true }).stdout;
      });

      itCreatesOutputDir();
      itKeepsDirStructure();
      itPrintsProgressDetails();
      itOutputsDevFiles();
      itDoesNotCreateSourceMapFiles();
      itCreatesInlineSourceMaps();
    });

    describe(`'src/**/*.js' -d out -p -s`, () => {
      beforeAll(() => {
        inputGlobs = 'src/**/*.js';
        inputFiles = ['src/index.js', 'src/constants/index.js'];
        outputDir = 'lib';
        outputFiles = ['lib/index.js', 'lib/constants/index.js'];
        commandExec = `${tsNodeExec} ${wuzzleTranspilePath} '${inputGlobs}' -d ${outputDir} -p -s`;
        shelljs.rm('-fr', outputDir);
        stdout = shelljs.exec(commandExec, { silent: true }).stdout;
      });

      itCreatesOutputDir();
      itKeepsDirStructure();
      itPrintsProgressDetails();
      itOutputsProdFiles();
      itCreatesSourceMapFiles();
      itDoesNotCreateInlineSourceMaps();
    });

    describe(`'src/**/*.js' -d out -p -s inline`, () => {
      beforeAll(() => {
        inputGlobs = 'src/**/*.js';
        inputFiles = ['src/index.js', 'src/constants/index.js'];
        outputDir = 'lib';
        outputFiles = ['lib/index.js', 'lib/constants/index.js'];
        commandExec = `${tsNodeExec} ${wuzzleTranspilePath} '${inputGlobs}' -d ${outputDir} -p -s inline`;
        shelljs.rm('-fr', outputDir);
        stdout = shelljs.exec(commandExec, { silent: true }).stdout;
      });

      itCreatesOutputDir();
      itKeepsDirStructure();
      itPrintsProgressDetails();
      itOutputsProdFiles();
      itDoesNotCreateSourceMapFiles();
      itCreatesInlineSourceMaps();
    });

    describe(`'src/**/*.js' -d out -V`, () => {
      beforeAll(() => {
        inputGlobs = 'src/**/*.js';
        inputFiles = ['src/index.js', 'src/constants/index.js'];
        outputDir = 'lib';
        outputFiles = ['lib/index.js', 'lib/constants/index.js'];
        commandExec = `${tsNodeExec} ${wuzzleTranspilePath} '${inputGlobs}' -d ${outputDir} -V`;
        shelljs.rm('-fr', outputDir);
        stdout = shelljs.exec(commandExec, { silent: true }).stdout;
      });

      itCreatesOutputDir();
      itKeepsDirStructure();
      itPrintsProgressDetails();
      itPrintsCleanMessage();
      itOutputsDevFiles();
      itDoesNotCreateSourceMapFiles();
      itDoesNotCreateInlineSourceMaps();
    });

    describe(`'src/**/*.js' -d out -w -V`, () => {
      beforeAll(async () => {
        inputGlobs = 'src/**/*.js';
        inputFiles = ['src/index.js', 'src/constants/index.js'];
        inputTempFile = 'src/temp.js';
        outputDir = 'lib';
        outputFiles = ['lib/index.js', 'lib/constants/index.js'];
        outputTempFile = 'lib/temp.js';
        commandExec = `${tsNodeExec} ${wuzzleTranspilePath} '${inputGlobs}' -d ${outputDir} -w -V`;
        shelljs.rm('-fr', outputDir, inputTempFile);
        commandProc = shelljs.exec(commandExec, { silent: true, async: true });

        stdout = await new Promise(resolve => {
          const outputLines: string[] = [];
          commandProc.stdout?.on('data', function onData(outputLine) {
            outputLines.push(outputLine);
            if (outputLine.includes('Start watching')) {
              commandProc.stdout?.off('data', onData);
              resolve(outputLines.join(''));
            }
          });
        });
      });

      afterAll(() => commandProc.kill());

      itCreatesOutputDir();
      itKeepsDirStructure();
      itPrintsProgressDetails();
      itPrintsWatchMessage();
      itOutputsDevFiles();
      itDoesNotCreateSourceMapFiles();
      itDoesNotCreateInlineSourceMaps();
      itCreatesOutputFileOnInputFileCreated();
      itUpdatesOutputFileOnInputFileUpdated();
      itRemovesOutputFileOnInputFileRemoved();
    });

    function itCreatesOutputDir() {
      it('creates output dir', () => {
        expect(shelljs.test('-d', outputDir)).toBe(true);
      });
    }

    function itKeepsDirStructure() {
      it('keeps input hierarchy in output dir', () => {
        inputFiles.forEach(inputFile => {
          const outputFile = inputFile.replace('src', outputDir);
          expect(shelljs.test('-f', outputFile)).toBe(true);
        });
      });
    }

    function itPrintsProgressDetails() {
      it('prints progress details', () => {
        expect(stdout).toContain(`Start compiling '${inputGlobs}'`);
        inputFiles.forEach(inputFile => {
          expect(stdout).toContain(`File '${inputFile}' compiled`);
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
        outputFiles.forEach(outputFile => {
          expect(shelljs.cat(outputFile).stdout).toContain('__webpack_require__');
        });
      });
    }

    function itOutputsProdFiles() {
      it('it outputs prod files', () => {
        outputFiles.forEach(outputFile => {
          expect(shelljs.cat(outputFile).stdout).not.toContain('__webpack_require__');
        });
      });
    }

    function itCreatesSourceMapFiles() {
      it('does not create source map files', () => {
        outputFiles.forEach(outputFile => {
          expect(shelljs.test('-f', `${outputFile}.map`)).toBe(true);
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
        const stdoutLine = await new Promise(resolve => {
          commandProc.stdout?.on('data', function onData(outputLine) {
            commandProc.stdout?.off('data', onData);
            resolve(outputLine);
          });
          shelljs.touch(inputTempFile);
        });
        expect(stdoutLine).toContain(`File '${inputTempFile}' compiled`);
        expect(shelljs.test('-f', outputTempFile)).toBe(true);
      });
    }

    function itUpdatesOutputFileOnInputFileUpdated() {
      it('updates output file on input file updated', async () => {
        const newContent = 'console.log()';
        const stdoutLine = await new Promise(resolve => {
          commandProc.stdout?.on('data', function onData(outputLine) {
            commandProc.stdout?.off('data', onData);
            resolve(outputLine);
          });
          fs.writeFileSync(inputTempFile, newContent);
        });
        expect(stdoutLine).toContain(`File '${inputTempFile}' recompiled`);
        expect(shelljs.cat(outputTempFile).stdout).toContain(newContent);
      });
    }

    function itRemovesOutputFileOnInputFileRemoved() {
      it('removes output file on input file removed', async () => {
        const stdoutLine = await new Promise(resolve => {
          commandProc.stdout?.on('data', function onData(outputLine) {
            commandProc.stdout?.off('data', onData);
            resolve(outputLine);
          });
          shelljs.rm('-f', inputTempFile);
        });
        expect(stdoutLine).toContain(`File '${inputTempFile}' removed`);
        expect(shelljs.test('-f', outputTempFile)).toBe(false);
      });
    }

    function itIgnoresDirNodeModules() {
      it(`ignores dir 'node_modules'`, () => {
        expect(stdout).not.toContain(`File 'node_modules`);
        expect(shelljs.test('-d', `${outputDir}/node_modules`)).toBe(false);
      });
    }

    function itIgnoresDirSrcConstants() {
      it(`ignores dir 'src/constants'`, () => {
        expect(stdout).not.toContain(`File 'src/constants`);
        expect(shelljs.test('-d', `${outputDir}/constants`)).toBe(false);
      });
    }
  });
});
