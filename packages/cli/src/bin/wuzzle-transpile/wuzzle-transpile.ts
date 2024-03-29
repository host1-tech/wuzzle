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

import { logError, logPlain, longestCommonPrefix } from '@wuzzle/helpers';

import { CHAR_CTRL_D, EK, EXIT_CODE_ERROR, EXIT_CODE_USER_TERMINATION } from '../../constants';
import { transpile } from '../../transpile';
import { checkToUseDryRunMode, envGet, envSet, locateProjectAnchor } from '../../utils';

const projectPath = locateProjectAnchor();
checkToUseDryRunMode(process.argv);

// Set command same env variables as 'wuzzle transpile'
envSet(EK.COMMAND_NAME, 'transpile');
envSet(EK.COMMAND_ARGS, process.argv.slice(2));

const program = new Command('wuzzle-transpile');
const version = require('../../../package.json').version;

program
  .arguments('<globs...>')
  .requiredOption('-d, --out-dir <dir>', 'Compile input files into output directory.')
  .option('-w, --watch', 'Recompile files on changes.')
  .option(
    '--ignore <string>',
    `List of globs not to compile, split by ",". (default: "**/node_modules/**,<absoluteOutDir>/**,**/*.d.ts?(x)")`
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
  .option('-F, --follow', `Follow symlinked directories when expanding "**" patterns.`)
  .option('-V, --verbose', 'Show more details.')
  .helpOption('-h, --help', 'Output usage information.')
  .version(version, '-v, --version', 'Output the version number.');

program.parse(process.argv);

ensureArgs();
launchExec().catch(e => logError(e));

function ensureArgs() {
  if (!program.args.length) {
    logError('error: input globs not specified.');
    process.exit(EXIT_CODE_ERROR);
  }

  if (program.ignore === undefined) {
    program.ignore = `**/node_modules/**,${path.resolve(program.outDir)}/**,**/*.d.ts?(x)`;
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
    logError(`error: option '-t, --target ${program.target}' not supported.`);
    process.exit(EXIT_CODE_ERROR);
  }

  if (![undefined, true, 'none', 'file', 'inline'].includes(program.sourceMap)) {
    logError(`error: option '-s, --source-map ${program.sourceMap}' not supported.`);
    process.exit(EXIT_CODE_ERROR);
  } else if (program.sourceMap === undefined) {
    program.sourceMap = 'none';
  } else if (program.sourceMap === true) {
    program.sourceMap = 'file';
  }
}
async function launchExec() {
  // Calculate input options
  const { verbose, clean, watch, follow, args: inputGlobs } = program;
  const ignore = program.ignore.split(',');

  const verboseLog = verbose ? logPlain : noop;
  const forceLog = logPlain;

  const inputPaths = uniq(
    inputGlobs
      .map(g => glob.sync(g, { cwd: projectPath, absolute: true, nodir: true, ignore, follow }))
      .reduce((m, p) => (m.push(...p), m), [])
  );

  if (!inputPaths.length) {
    forceLog(yellow('No input file found.'));
    return;
  }

  let basePath = path.resolve(program.basePath ?? longestCommonPrefix(inputPaths));
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

  const webpackConfig: webpack.Configuration = {
    mode: webpackMode,
    target: webpackTarget,
    ...(webpackDevtool ? { devtool: webpackDevtool } : {}),
  };

  if (envGet(EK.DRY_RUN)) {
    return await transpile({ webpackConfig });
  }

  // Check to clean output dir
  if (clean) {
    rimraf.sync(outDir);
    verboseLog(grey(`Directory '${path.relative(projectPath, outDir)}' cleaned.`));
  }

  // Organize transpile tasks
  const inputPathsCompiled: Record<string, boolean> = {};

  async function action(inputPath: string) {
    inputPath = path.resolve(inputPath);
    const outputPath = path.join(outDir, path.relative(basePath, inputPath));
    try {
      await transpile({ inputPath, outputPath, webpackConfig });
      if (inputPathsCompiled[inputPath]) {
        forceLog(grey(`File '${path.relative(projectPath, inputPath)}' recompiled.`));
      } else {
        forceLog(grey(`File '${path.relative(projectPath, inputPath)}' compiled.`));
        inputPathsCompiled[inputPath] = true;
      }
    } catch (e) {
      forceLog(yellow(`File '${path.relative(projectPath, inputPath)}' compilation failed.`));
      logError(e);
      watch || process.exit(EXIT_CODE_ERROR);
    }
  }

  function remove(inputPath: string) {
    inputPath = path.resolve(inputPath);
    const outputPath = path.join(outDir, path.relative(basePath, inputPath));
    rimraf.sync(outputPath);
    inputPathsCompiled[inputPath] = false;
    verboseLog(grey(`File '${path.relative(projectPath, inputPath)}' removed.`));
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
