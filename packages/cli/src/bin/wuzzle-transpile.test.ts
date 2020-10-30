import shelljs from 'shelljs';
import path from 'path';
import findUp from 'find-up';

const packageJsonPath = findUp.sync('package.json', { cwd: __filename })!;
const projectPath = path.dirname(packageJsonPath);
const fixturePath = path.resolve(projectPath, '__tests__/fixtures/wuzzle-transpile');
const wuzzleTranspilePath = require.resolve('./wuzzle-transpile');

const tsNodeExec = `cross-env DEBUG='@wuzzle/cli:applyConfig' cross-env TS_NODE_TYPE_CHECK=false ts-node`;

describe('src/bin/wuzzle-transpile', () => {
  beforeAll(() => shelljs.cd(fixturePath));

  describe('when executing with help option', () => {
    it.each(['-h', '--help'])(`prints help information with '%s'`, option => {
      const { stdout } = shelljs.exec(`${tsNodeExec} ${wuzzleTranspilePath} ${option}`, {
        silent: true,
      });
      expect(stdout).toContain('Usage: wuzzle-transpile [options] <globs...>');
    });
  });

  describe('when executing with input absence', () => {
    it(`prints error with no input`, () => {
      const { stderr } = shelljs.exec(`${tsNodeExec} ${wuzzleTranspilePath}`, { silent: true });
      expect(stderr).toContain(`error: required option '-d, --out-dir <dir>' not specified`);
    });

    it(`prints error with input globs only`, () => {
      const { stderr } = shelljs.exec(`${tsNodeExec} ${wuzzleTranspilePath} 'src/**/*.js'`, {
        silent: true,
      });
      expect(stderr).toContain(`error: required option '-d, --out-dir <dir>' not specified`);
    });

    it.each(['-d', '--out-dir'])(`prints error with '%s' only`, option => {
      const { stderr } = shelljs.exec(`${tsNodeExec} ${wuzzleTranspilePath} ${option} out`, {
        silent: true,
      });
      expect(stderr).toContain('error: input globs not specified');
    });
  });

  describe('when executing with...', () => {
    let inputGlobs: string;
    let inputFiles: string[];
    let outputDir: string;
    let outputFiles: string[];
    let commandExec: string;
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
      itDoesNotCreateSourceMapFiles();
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
      itDoesNotCreateSourceMapFiles();
      itIgnoresDirNodeModules();
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
      itDoesNotCreateSourceMapFiles();
      itIgnoresDirSrcConstants();
    });

    function itCreatesOutputDir() {
      it('creates output dir', () => {
        expect(shelljs.test('-d', outputDir)).toBe(true);
      });
    }

    function itKeepsDirStructure() {
      it('keeps input hierarchy', () => {
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

    function itDoesNotCreateSourceMapFiles() {
      it('does not create source map files', () => {
        outputFiles.forEach(outputFile => {
          expect(shelljs.test('-f', `${outputFile}.map`)).toBe(false);
        });
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
