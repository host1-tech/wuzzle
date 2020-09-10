import { cloneDeep, merge } from 'lodash';
import MemoryFileSystem from 'memory-fs';
import path from 'path';
import pify from 'pify';
import shelljs from 'shelljs';
import { v4 as uuidv4 } from 'uuid';
import webpack from 'webpack';
import applyConfig from '../applyConfig';

const mfs = new MemoryFileSystem();

export interface TranspileOptions {
  inputCode?: string;
  inputCodeBasename?: string;
  inputPath?: string;
  outputPath?: string;
  outputCodeBasename?: string;
  webpackConfig?: webpack.Configuration;
}

const transpileDefaultOptions: TranspileOptions = {
  inputCode: '',
  inputCodeBasename: 'index.js',
  outputCodeBasename: 'index.js',
  webpackConfig: { target: 'node', mode: 'development' },
};

async function transpile(options: TranspileOptions): Promise<string> {
  options = merge({}, transpileDefaultOptions, options);

  const shouldReadFromFile = Boolean(options.inputPath);
  const shouldWriteToFile = Boolean(options.outputPath);

  // Create transpilation webpack config and adjust
  const webpackConfig = cloneDeep(options.webpackConfig!);

  let inputPath: string;
  if (shouldReadFromFile) {
    inputPath = path.resolve(options.inputPath!);
    if (!shelljs.test('-f', inputPath)) {
      throw new Error(`Cannot find inputPath \`${options.inputPath}\`.`);
    }
  } else {
    inputPath = `/${uuidv4()}/${options.inputCodeBasename}`;
    mfs.mkdirpSync(path.dirname(inputPath));
    mfs.writeFileSync(inputPath, options.inputCode!);
  }
  webpackConfig.context = path.dirname(inputPath);
  webpackConfig.entry = inputPath;

  let outputPath: string;
  if (shouldWriteToFile) {
    outputPath = path.resolve(options.outputPath!);
  } else {
    outputPath = `/${uuidv4()}/${options.outputCodeBasename}`;
  }
  webpackConfig.output = {
    libraryTarget: 'umd',
    path: path.dirname(outputPath),
    filename: path.basename(outputPath),
  };

  webpackConfig.externals = [
    (context, request, callback) => {
      if (request == inputPath) {
        callback();
      } else {
        callback(null, `commonjs ${request}`);
      }
    },
  ];

  applyConfig(webpackConfig);

  // Create transpilation webpack compiler and run
  const webpackCompiler = pify(webpack(webpackConfig));
  if (!shouldReadFromFile) {
    webpackCompiler.inputFileSystem = mfs;
  }

  if (!shouldWriteToFile) {
    webpackCompiler.outputFileSystem = mfs;
  }

  await webpackCompiler.run();

  if (!shouldReadFromFile) {
    mfs.unlinkSync(inputPath);
  }

  let outputCode = '';
  if (!shouldWriteToFile) {
    outputCode = mfs.readFileSync(outputPath).toString();
    mfs.unlinkSync(outputPath);
  }

  return outputCode;
}

export default transpile;
