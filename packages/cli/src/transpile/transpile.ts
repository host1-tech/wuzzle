import { cloneDeep, merge } from 'lodash';
import MemoryFileSystem from 'memory-fs';
import path from 'path';
import shelljs from 'shelljs';
import webpack from 'webpack';
import pify from 'pify';
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

async function transpile(options: TranspileOptions = {}): Promise<string> {
  options = merge({}, transpileDefaultOptions, options);

  const imfs = !options.inputPath && new MemoryFileSystem();
  const omfs = !options.outputPath && new MemoryFileSystem();

  // Create webpack config and apply wuzzle config
  const webpackConfig = cloneDeep(options.webpackConfig || {});

  let inputPath: string;
  if (imfs) {
    inputPath = path.resolve(options.inputCodePath!);
    imfs.mkdirpSync(path.dirname(inputPath));
    imfs.writeFileSync(inputPath, options.inputCode!, 'utf8');
  } else {
    inputPath = path.resolve(options.inputPath!);
    if (!shelljs.test('-f', inputPath)) {
      throw new Error(`Cannot find inputPath \`${options.inputPath}\`.`);
    }
  }
  webpackConfig.entry = inputPath;

  let outputPath: string;
  if (omfs) {
    outputPath = path.resolve(options.outputCodePath!);
  } else {
    outputPath = path.resolve(options.outputPath!);
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
  if (imfs) {
    webpackCompiler.inputFileSystem = imfs;
  }
  if (omfs) {
    webpackCompiler.outputFileSystem = omfs;
  }

  await webpackCompiler.run();

  const outputCode = omfs ? omfs.readFileSync(outputPath).toString() : '';

  // Destroy memory file system if created
  if (imfs) {
    imfs.unlinkSync(inputPath);
    delete imfs.data;
  }
  if (omfs) {
    omfs.unlinkSync(outputPath);
    delete omfs.data;
  }

  return outputCode;
}

export default transpile;
