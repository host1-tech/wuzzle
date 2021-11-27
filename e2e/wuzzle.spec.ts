import glob from 'glob';
import path from 'path';
import shelljs from 'shelljs';
import { genEndToEndExec } from './utils';

const globalDirSuffix = '-global';

interface FixtureInfo {
  fixtureDir: string;
  command: string;
  envOverrides?: Record<string, string>;
  outputDir?: string;
  outputContents?: Record<string, string>;
  outputMessages?: string[];
  testGlobal?: boolean | 'with-install';
  testDryRun?: boolean;
  testUnregister?: boolean;
}

const fixtureInfoAllInOne: Record<string, Record<string, FixtureInfo>> = {
  ['webpack']: {
    ['4.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/webpack__4.x'),
      command: 'webpack',
      outputDir: 'dist',
      outputContents: {
        ['dist/index.js']: 'Hi, Webpack 4.x.',
      },
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
    ['5.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/webpack__5.x'),
      command: 'webpack',
      outputDir: 'dist',
      outputContents: {
        ['dist/index.js']: 'Hi, Webpack 5.x.',
      },
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
  },
  ['electron-webpack']: {
    ['2.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/electron-webpack__2.x'),
      command: 'electron-webpack --progress=false',
      outputDir: 'dist',
      outputContents: {
        ['dist/renderer/renderer.js']: 'Hi, EW 2.x.',
      },
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
  },
  ['jest']: {
    ['24.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/jest__24.x'),
      command: 'jest',
      outputMessages: ['Hi, Jest 24.x.'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
    ['25.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/jest__25.x'),
      command: 'jest',
      outputMessages: ['Hi, Jest 25.x.'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
    ['26.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/jest__26.x'),
      command: 'jest',
      outputMessages: ['Hi, Jest 26.x.'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
    ['27.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/jest__27.x'),
      command: 'jest',
      outputMessages: ['Hi, Jest 27.x.'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
  },
  ['mocha']: {
    ['7.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/mocha__7.x'),
      command: 'mocha src/index.test.js',
      outputMessages: ['Hi, Mocha 7.x.'],
      testGlobal: true,
      testDryRun: true,
    },
    ['8.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/mocha__8.x'),
      command: 'mocha src/index.test.js',
      outputMessages: ['Hi, Mocha 8.x.'],
      testGlobal: true,
      testDryRun: true,
    },
  },
  ['next']: {
    ['9.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/next__9.x'),
      command: 'next build',
      outputDir: '.next',
      outputContents: {
        '.next/static/chunks/pages/index-*.js': 'Hi, Next 9.x.',
      },
      testDryRun: true,
      testUnregister: true,
      // Won't test 'next' global because it even fails on its bare own
    },
  },
  ['node']: {
    ['current']: {
      fixtureDir: path.join(__dirname, 'fixtures/node'),
      command: 'node src/index.js',
      outputMessages: ['Hi, Node.'],
      testDryRun: true,
    },
  },
  ['razzle build']: {
    ['3.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/razzle__3.x'),
      command: 'razzle build',
      outputDir: 'build',
      outputContents: {
        ['build/public/static/js/bundle.*.js']: 'Hi, Razzle 3.x.',
      },
      testGlobal: 'with-install',
      testDryRun: true,
      testUnregister: true,
    },
    ['4.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/razzle__4.x'),
      command: 'razzle build',
      envOverrides: { CI: 'true' },
      outputDir: 'build',
      outputContents: {
        ['build/public/static/js/client.*.js']: 'Hi, Razzle 4.x.',
      },
      testGlobal: 'with-install',
      testDryRun: true,
      testUnregister: true,
    },
  },
  ['razzle test']: {
    ['3.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/razzle__3.x'),
      command: 'razzle test --env=jsdom',
      envOverrides: { CI: 'true' },
      outputMessages: ['Hi, Razzle 3.x.'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
    ['4.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/razzle__4.x'),
      command: 'razzle test --env=jsdom',
      envOverrides: { CI: 'true' },
      outputMessages: ['Hi, Razzle 4.x.'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
  },
  ['react-scripts build']: {
    ['3.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/react-scripts__3.x'),
      command: 'react-scripts build',
      outputDir: 'build',
      outputContents: {
        ['build/static/js/main.*.chunk.js']: 'Hi, CRA 3.x.',
      },
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
    ['4.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/react-scripts__4.x'),
      command: 'react-scripts build',
      outputDir: 'build',
      outputContents: {
        ['build/static/js/main.*.chunk.js']: 'Hi, CRA 4.x.',
      },
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
  },
  ['react-scripts test']: {
    ['3.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/react-scripts__3.x'),
      command: 'react-scripts test',
      envOverrides: { CI: 'true' },
      outputMessages: ['Hi, CRA 3.x.'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
    ['4.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/react-scripts__4.x'),
      command: 'react-scripts test',
      envOverrides: { CI: 'true' },
      outputMessages: ['Hi, CRA 4.x.'],
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
  },
  ['storybook']: {
    ['6.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/storybook__6.x'),
      command: 'build-storybook --quiet',
      outputDir: 'storybook-static',
      outputContents: {
        ['storybook-static/main.*.iframe.bundle.js']: 'Hi, Storybook 6.x.',
      },
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
  },
  ['taro build:h5']: {
    ['2.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/taro__2.x'),
      command: 'taro build --type=h5',
      outputDir: 'dist',
      outputContents: {
        ['dist/chunk/index_index.js']: 'Hi, Taro 2.x.',
      },
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
  },
  ['taro build:weapp']: {
    ['2.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/taro__2.x'),
      command: 'taro build --type=weapp',
      outputDir: 'dist',
      outputContents: {
        ['dist/pages/index/index.wxml']: 'Hi, Taro 2.x.',
      },
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
  },
  ['transpile']: {
    ['current']: {
      fixtureDir: path.join(__dirname, 'fixtures/transpile'),
      command: `transpile 'src/**/*.js' -d lib`,
      outputDir: 'lib',
      outputContents: {
        ['lib/index.js']: 'Hi, WT.',
      },
      testDryRun: true,
    },
  },
  ['vue-cli-service build']: {
    ['4.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/vue-cli-service__4.x'),
      command: 'vue-cli-service build',
      outputDir: 'dist',
      outputContents: {
        ['dist/js/app*.js']: 'Hi, Vue CLI 4.x.',
      },
      testGlobal: true,
      testDryRun: true,
      testUnregister: true,
    },
  },
};

const originalEnvPath = process.env.PATH;

describe.each(Object.keys(fixtureInfoAllInOne))('wuzzle %s', packageDesc => {
  const fixtureInfo = fixtureInfoAllInOne[packageDesc];
  const moduleName = packageDesc.split(' ')[0];
  describe.each(Object.keys(fixtureInfo))(`${moduleName} %s`, versionFlag => {
    const {
      fixtureDir,
      command,
      envOverrides,
      outputDir,
      outputContents,
      outputMessages,
      testGlobal,
      testDryRun,
      testUnregister,
    } = fixtureInfo[versionFlag];
    const commandName = command.split(' ')[0];

    beforeEach(() => {
      if (outputDir) shelljs.rm('-fr', outputDir);
      process.env.PATH = originalEnvPath;
    });

    it(`runs ${command}`, () => {
      shelljs.cd(fixtureDir);
      const result = shelljs.exec(genEndToEndExec({ command, envOverrides }));
      verifyCompilationResult(result);
    });

    if (testGlobal) {
      it(`runs ${command} from globals`, () => {
        const globalDir = fixtureDir + globalDirSuffix;
        const globalNodeModules = path.join(path.dirname(globalDir), 'node_modules');
        shelljs.rm('-fr', globalDir, globalNodeModules);
        shelljs.mkdir(globalDir);
        const globalContents = glob.sync(path.join(fixtureDir, '*'), {
          absolute: true,
          dot: true,
          ignore: ['**/node_modules'],
        });
        shelljs.cp('-fr', globalContents, globalDir);
        shelljs.cd(globalDir);
        if (testGlobal === 'with-install') {
          shelljs.exec('yarn --prod');
        }
        shelljs.ln('-s', path.join(fixtureDir, 'node_modules'), globalNodeModules);
        process.env.PATH = `${path.join(fixtureDir, 'node_modules/.bin')}${
          process.platform === 'win32' ? ';' : ':'
        }${process.env.PATH}`;
        const result = shelljs.exec(genEndToEndExec({ command, envOverrides }));
        verifyCompilationResult(result);
        expect(result.stdout).toEqual(
          expect.stringMatching(`Command '${commandName}' is resolved from globals:`)
        );
      });
    }

    if (testDryRun) {
      it(`runs ${command} in dry-run mode`, () => {
        shelljs.cd(fixtureDir);
        const {
          stdout,
          stderr,
          code: exitCode,
        } = shelljs.exec(genEndToEndExec({ command: `${command} --dry-run`, envOverrides }));

        expect(exitCode).toBe(0);
        expect(stderr).toEqual(expect.stringContaining('Wuzzle process mounted in CWD:'));

        if (outputContents) {
          Object.keys(outputContents).forEach(outputPath => {
            expect(glob.sync(outputPath)).toHaveLength(0);
          });
        }
        if (outputMessages) {
          outputMessages.forEach(outputMessage => {
            expect(stdout + stderr).toEqual(expect.not.stringContaining(outputMessage));
          });
        }
      });
    }

    if (testUnregister) {
      it(`unregisters ${commandName}`, () => {
        shelljs.cd(fixtureDir);
        expect(
          shelljs.exec(genEndToEndExec({ command: `unregister ${commandName}`, envOverrides })).code
        ).toBe(0);

        const { stderr, code: exitCode } = shelljs.exec(
          genEndToEndExec({
            envOverrides: { ...envOverrides, SKIP_PREFLIGHT_CHECK: 'true' },
            wrapper: 'yarn',
            command,
          })
        );
        expect(exitCode).toBe(0);
        expect(stderr).not.toEqual(expect.stringContaining('Wuzzle process mounted in CWD:'));
      });
    }

    function verifyCompilationResult({ stdout, stderr, code: exitCode }: shelljs.ShellString) {
      expect(exitCode).toBe(0);
      expect(stderr).toEqual(expect.stringContaining('Wuzzle process mounted in CWD:'));

      if (outputDir) expect(shelljs.test('-d', outputDir)).toBe(true);
      if (outputContents) {
        Object.keys(outputContents).forEach(outputPath => {
          expect(shelljs.cat(glob.sync(outputPath)[0]).stdout).toEqual(
            expect.stringContaining(outputContents[outputPath])
          );
        });
      }
      if (outputMessages) {
        outputMessages.forEach(outputMessage => {
          expect(stdout + stderr).toEqual(expect.stringContaining(outputMessage));
        });
      }
    }
  });
});
