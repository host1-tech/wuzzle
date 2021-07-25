import glob from 'glob';
import path from 'path';
import shelljs from 'shelljs';
import { genWuzzleExec } from './utils';

interface FixtureInfo {
  fixtureDir: string;
  command: string;
  envOverrides?: Record<string, string>;
  outputDir?: string;
  outputContents?: Record<string, string>;
  outputMessages?: string[];
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
    },
    ['5.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/webpack__5.x'),
      command: 'webpack',
      outputDir: 'dist',
      outputContents: {
        ['dist/index.js']: 'Hi, Webpack 5.x.',
      },
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
    },
  },
  ['jest']: {
    ['24.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/jest__24.x'),
      command: 'jest',
      outputMessages: ['Hi, Jest 24.x.'],
    },
    ['25.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/jest__25.x'),
      command: 'jest',
      outputMessages: ['Hi, Jest 25.x.'],
    },
    ['26.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/jest__26.x'),
      command: 'jest',
      outputMessages: ['Hi, Jest 26.x.'],
    },
  },
  ['mocha']: {
    ['7.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/mocha__7.x'),
      command: 'mocha src/index.test.js',
      outputMessages: ['Hi, Mocha 7.x.'],
    },
    ['8.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/mocha__8.x'),
      command: 'mocha src/index.test.js',
      outputMessages: ['Hi, Mocha 8.x.'],
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
    },
  },
  ['node']: {
    ['current']: {
      fixtureDir: path.join(__dirname, 'fixtures/node'),
      command: 'node src/index.js',
      outputMessages: ['Hi, Node.'],
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
    },
  },
  ['razzle test']: {
    ['3.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/razzle__3.x'),
      command: 'razzle test --env=jsdom',
      envOverrides: { CI: 'true' },
      outputMessages: ['Hi, Razzle 3.x.'],
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
    },
    ['4.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/react-scripts__4.x'),
      command: 'react-scripts build',
      outputDir: 'build',
      outputContents: {
        ['build/static/js/main.*.chunk.js']: 'Hi, CRA 4.x.',
      },
    },
  },
  ['react-scripts test']: {
    ['3.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/react-scripts__3.x'),
      command: 'react-scripts test',
      envOverrides: { CI: 'true' },
      outputMessages: ['Hi, CRA 3.x.'],
    },
    ['4.x']: {
      fixtureDir: path.join(__dirname, 'fixtures/react-scripts__4.x'),
      command: 'react-scripts test',
      envOverrides: { CI: 'true' },
      outputMessages: ['Hi, CRA 4.x.'],
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
    },
  },
};

const timeoutInMs = 30000;

describe.each(Object.keys(fixtureInfoAllInOne))('wuzzle %s', packageFlag => {
  it.each(Object.keys(fixtureInfoAllInOne[packageFlag]))(
    `works with ${packageFlag.split(' ')[0]} %s`,
    versionFlag => {
      const { fixtureDir, command, envOverrides, outputDir, outputContents, outputMessages } =
        fixtureInfoAllInOne[packageFlag][versionFlag];

      shelljs.cd(fixtureDir);
      if (outputDir) shelljs.rm('-fr', outputDir);

      const { stdout, stderr, code: exitCode } = shelljs.exec(genWuzzleExec(command, envOverrides));

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
    },
    timeoutInMs
  );
});
