import { longestCommonPrefix } from '@wuzzle/helpers';
import { blue, green, grey, yellow } from 'chalk';
import chokidar from 'chokidar';
import { Command } from 'commander';
import fs from 'fs';
import glob from 'glob';
import { noop, uniq } from 'lodash';
import os from 'os';
import pMap from 'p-map';
import path from 'path';
import rimraf from 'rimraf';
import type webpack from 'webpack';
import {
  CHAR_CTRL_D,
  EK_COMMAND_ARGS,
  EK_COMMAND_NAME,
  EXIT_CODE_ERROR,
  EXIT_CODE_USER_TERMINATION,
} from '../../constants';
import { transpile } from '../../transpile';

// Set command same env variables as 'wuzzle transpile'
process.env[EK_COMMAND_NAME] = 'transpile';
process.env[EK_COMMAND_ARGS] = JSON.stringify(process.argv.slice(2));

const program = new Command('wuzzle-transpile');
const version = require('../../../package.json').version;

program
  .arguments('<globs...>')
  .requiredOption('-d, --out-dir <dir>', 'Compile input files into output directory.')
  .option('-w, --watch', 'Recompile files on changes.')
  .option(
    '--ignore <globs...>',
    `List of globs not to compile. (default: '**/node_modules/**' '<absoluteOutDir>/**')`
  )
  .option(
    '-b, --base-path <path>',
    'Resolve input files relative to base path for output subpaths in output directory. ' +
      '(default: longest common path of input files)'
  )
  .option(
    '-c, --concurrency <number>',
    'Prevent compiling more than specific amount of files at the same time. ' +
      '(default: os.cpus().length)'
  )
  .option('-p, --production', 'Tell webpack to use production optimization')
  .option(
    '-t, --target <string>',
    'Set wepback deployment target. One of "async-node", "electron-main", "electron-renderer", ' +
      '"electron-preload", "node", "node-webkit", "web", or "webworker".',
    'node'
  )
  .option(
    '-s, --source-map [string]',
    'Generate source map. One of "none", "file", or "inline". (default: "none", or ' +
      '"file" if specified without value)'
  )
  .option('--no-clean', 'Prevent cleaning out directory.')
  .option('-F, --follow', `Follow symlinked directories when expanding '**' patterns.`)
  .option('-V, --verbose', 'Show more details.')
  .helpOption('-h, --help', 'Output usage information.')
  .version(version, '-v, --version', 'Output the version number.');

program.parse(process.argv);

ensureArgs();
launchExec().catch(e => console.error(e.stack ?? e));

function ensureArgs() {
  if (!program.args.length) {
    console.error('error: input globs not specified.');
    process.exit(EXIT_CODE_ERROR);
  }

  if (!program.ignore) {
    program.ignore = ['**/node_modules/**', `${path.resolve(program.outDir)}/**`];
  }

  if (
    ![
      'async-node',
      'electron-main',
      'electron-renderer',
      'electron-preload',
      'node',
      'node-webkit',
      'web',
      'webworker',
    ].includes(program.target)
  ) {
    console.error(`error: option '-t, --target ${program.target}' not supported.`);
    process.exit(EXIT_CODE_ERROR);
  }

  if (![undefined, true, 'none', 'file', 'inline'].includes(program.sourceMap)) {
    console.error(`error: option '-s, --source-map ${program.sourceMap}' not supported.`);
    process.exit(EXIT_CODE_ERROR);
  } else if (program.sourceMap === undefined) {
    program.sourceMap = 'none';
  } else if (program.sourceMap === true) {
    program.sourceMap = 'file';
  }
}
async function launchExec() {
  // Calculate input options
  const { verbose, clean, watch, ignore, follow, args: inputGlobs } = program;

  const verboseLog = verbose ? console.log : noop;
  const forceLog = console.log;
  const errorLog = console.error;

  const inputPaths = uniq(
    inputGlobs
      .map(g => glob.sync(g, { absolute: true, ignore, follow }))
      .reduce((m, p) => (m.push(...p), m), [])
      .filter(p => fs.statSync(p).isFile())
  );

  if (!inputPaths.length) {
    forceLog(yellow('No input file found.'));
    return;
  }

  let basePath = path.resolve(program.basePath || longestCommonPrefix(inputPaths));
  try {
    if (!fs.statSync(basePath).isDirectory()) {
      throw 0;
    }
  } catch {
    basePath = path.dirname(basePath);
  }

  const outDir = path.resolve(program.outDir);
  const concurrency = parseInt(program.concurrency) || os.cpus().length;

  const webpackMode = program.production ? 'production' : 'development';
  const webpackTarget = program.target;
  const webpackDevtool: webpack.Options.Devtool | undefined =
    program.sourceMap === 'file'
      ? program.production
        ? 'source-map'
        : 'cheap-module-source-map'
      : program.sourceMap === 'inline'
      ? program.production
        ? 'inline-source-map'
        : 'inline-cheap-module-source-map'
      : undefined;

  // Check to clean output dir
  if (clean) {
    rimraf.sync(outDir);
    verboseLog(grey(`Directory '${path.relative(process.cwd(), outDir)}' cleaned.`));
  }

  // Organize transpile tasks
  const inputPathsCompiled: Record<string, boolean> = {};

  async function action(inputPath: string) {
    inputPath = path.resolve(inputPath);
    const outputPath = path.resolve(outDir, path.relative(basePath, inputPath));
    try {
      await transpile({
        inputPath,
        outputPath,
        webpackConfig: {
          mode: webpackMode,
          target: webpackTarget,
          devtool: webpackDevtool,
        },
      });
      if (inputPathsCompiled[inputPath]) {
        forceLog(grey(`File '${path.relative(process.cwd(), inputPath)}' recompiled.`));
      } else {
        forceLog(grey(`File '${path.relative(process.cwd(), inputPath)}' compiled.`));
        inputPathsCompiled[inputPath] = true;
      }
    } catch (e) {
      forceLog(yellow(`File '${path.relative(process.cwd(), inputPath)}' compilation failed.`));
      errorLog(e);
      watch || process.exit(EXIT_CODE_ERROR);
    }
  }

  function remove(inputPath: string) {
    inputPath = path.resolve(inputPath);
    const outputPath = path.resolve(outDir, path.relative(basePath, inputPath));
    rimraf.sync(outputPath);
    inputPathsCompiled[inputPath] = false;
    verboseLog(grey(`File '${path.relative(process.cwd(), inputPath)}' removed.`));
  }

  forceLog(blue(`Start compiling '${inputGlobs.join(`' '`)}'.`));
  await pMap(inputPaths, action, { concurrency });
  forceLog(green('All files compiled.'));

  // Create watcher for recompiling
  if (watch) {
    forceLog(blue(`Start watching '${inputGlobs.join(`' '`)}'.`));

    const watchOptions: chokidar.WatchOptions = {
      ignored: ignore,
      ignoreInitial: true,
    };

    chokidar
      .watch(inputGlobs, watchOptions)
      .on('add', action)
      .on('change', action)
      .on('unlink', remove);

    // Handle CTRL-D as exit signal
    process.stdin.on('data', chunk => {
      if (chunk.toString('binary').includes(CHAR_CTRL_D)) {
        process.exit(EXIT_CODE_USER_TERMINATION);
      }
    });
  }
}
