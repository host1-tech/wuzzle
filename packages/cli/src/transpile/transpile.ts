import { cloneDeep, merge } from 'lodash';
import MemoryFileSystem from 'memory-fs';
import path from 'path';
import pify from 'pify';
import shelljs from 'shelljs';
import webpack from 'webpack';
import applyConfig from '../applyConfig';

export interface TranspileOptions {
  inputPath?: string;
  inputCode?: string;
  inputCodePath?: string;
  outputPath?: string;
  outputCodePath?: string;
  webpackConfig?: webpack.Configuration;
}

const transpileDefaultOptions: TranspileOptions = {
  inputCode: '',
  inputCodePath: 'index.js',
  outputCodePath: 'index.js',
  webpackConfig: { target: 'node', mode: 'development' },
};

async function transpile(options: TranspileOptions): Promise<string> {
  options = merge({}, transpileDefaultOptions, options);

  const willReadFromFile = Boolean(options.inputPath);
  const willWriteToFile = Boolean(options.outputPath);

  const imfs = !willReadFromFile ? new MemoryFileSystem() : null;
  const omfs = !willWriteToFile ? new MemoryFileSystem() : null;

  // Create webpack config and apply wuzzle config
  const webpackConfig = cloneDeep(options.webpackConfig || {});

  let inputPath: string;
  if (willReadFromFile) {
    inputPath = path.resolve(options.inputPath!);
    if (!shelljs.test('-f', inputPath)) {
      throw new Error(`Cannot find inputPath \`${options.inputPath}\`.`);
    }
  } else {
    inputPath = path.resolve(options.inputCodePath!);
    imfs?.mkdirpSync(path.dirname(inputPath));
    imfs?.writeFileSync(inputPath, options.inputCode!);
  }
  webpackConfig.entry = inputPath;

  let outputPath: string;
  if (willWriteToFile) {
    outputPath = path.resolve(options.outputPath!);
  } else {
    outputPath = path.resolve(options.outputCodePath!);
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

  // Create webpack compiler and execute
  const webpackCompiler = pify(webpack(webpackConfig));
  if (!willReadFromFile) {
    webpackCompiler.inputFileSystem = imfs;
  }
  if (!willWriteToFile) {
    webpackCompiler.outputFileSystem = omfs;
  }

  await webpackCompiler.run();

  const outputCode = willWriteToFile ? '' : omfs?.readFileSync(outputPath).toString();

  // Destroy memory file system if created
  if (!willReadFromFile) {
    imfs?.unlinkSync(inputPath);
    delete imfs?.data;
  }
  if (!willWriteToFile) {
    omfs?.unlinkSync(outputPath);
    delete omfs?.data;
  }

  return outputCode;
}

export default transpile;
