import { longestCommonPrefix } from '@wuzzle/helpers';
import { green, grey, yellow } from 'chalk';
import { Command } from 'commander';
import glob from 'glob';
import { uniq } from 'lodash';
import os from 'os';
import pMap from 'p-map';
import path from 'path';
import shelljs from 'shelljs';
import type webpack from 'webpack';
import transpile from '../transpile';

const program = new Command();

program
  .arguments('<globs...>')
  .requiredOption('-d, --out-dir <dir>', 'Compile input files into output directory.')
  .option('-w, --watch', 'Recompile files on changes.')
  .option('--ignore <globs...>', 'List of globs not to compile.', '**/node_modules/**/*')
  .option(
    '-b, --base-path <path>',
    'Resolve input files relative to base path for output subpaths in output directory. ' +
      '(default: longest common path of input files)'
  )
  .option(
    '-c, --max-concurrency <number>',
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
  .option('-V, --verbose', 'Show more details.')
  .helpOption('-h, --help', 'Output usage information.')
  .version(require('../../package.json').version, '-v, --version', 'Output the version number.');

program.parse(process.argv);

ensureArgs();
launchExec();

function ensureArgs() {
  if (!program.args.length) {
    console.error('error: input globs not specified');
    process.exit(1);
  }

  if (!Array.isArray(program.ignore)) {
    program.ignore = [program.ignore];
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
    program.target = 'node';
  }

  if (![true, 'none', 'file', 'inline'].includes(program.sourceMap)) {
    program.sourceMap = 'none';
  } else if (program.sourceMap === true) {
    program.sourceMap = 'file';
  }
}

async function launchExec() {
  // Calculate input options
  const inputPaths = uniq(
    program.args
      .map(g => glob.sync(g, { ignore: program.ignore }))
      .reduce((m, p) => (m.push(...p.map(p => path.resolve(p))), m), [])
  );

  let basePath = path.resolve(program.basePath || longestCommonPrefix(inputPaths));
  if (!shelljs.test('-d', basePath)) basePath = path.dirname(basePath);

  const outDir = path.resolve(program.outDir);
  const maxConcurrency = parseInt(program.maxConcurrency) || os.cpus().length;
  const verbose = program.verbose;

  const webpackMode = program.production ? 'production' : 'development';
  const webpackTarget = program.target;
  const webpackDevtool: webpack.Options.Devtool | undefined =
    program.sourceMap == 'file'
      ? program.production
        ? 'source-map'
        : 'cheap-module-source-map'
      : program.sourceMap == 'inline'
      ? program.production
        ? 'inline-source-map'
        : 'inline-cheap-module-source-map'
      : undefined;

  // Organize transpile action
  async function action(inputPath: string) {
    try {
      await transpile({
        inputPath,
        outputPath: path.resolve(outDir, path.relative(basePath, inputPath)),
        webpackConfig: {
          mode: webpackMode,
          target: webpackTarget,
          devtool: webpackDevtool,
        },
      });
    } catch (e) {
      console.log(yellow(`File \`${inputPath}\` compilation failed.`));
      console.error(e);
      process.exit(1);
    }
    if (verbose) {
      console.log(grey(`File \`${inputPath}\` compiled.`));
    }
  }

  await pMap(inputPaths, action, { concurrency: maxConcurrency });
  if (verbose) {
    console.log(green('All files compiled.'));
  }
}
