import fs from 'fs';
import { cloneDeep, merge } from 'lodash';
import MemoryFileSystem from 'memory-fs';
import path from 'path';
import pify from 'pify';
import shelljs from 'shelljs';
import { RawSourceMap, SourceMapConsumer, SourceMapGenerator } from 'source-map';
import webpack from 'webpack';
import applyConfig from './applyConfig';

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
  webpackConfig: {
    output: {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    },
    target: 'node',
    mode: 'development',
  },
};

async function transpile(options: TranspileOptions = {}): Promise<string> {
  options = merge({}, transpileDefaultOptions, options);

  const imfs = !options.inputPath && new MemoryFileSystem();
  const omfs = !options.outputPath && new MemoryFileSystem();

  // Create webpack config and apply wuzzle config
  const webpackConfig = cloneDeep(options.webpackConfig!);

  let inputPath: string;
  if (imfs) {
    inputPath = path.resolve(options.inputCodePath!);
    correctInputMemoryFileSystem(imfs, { inputPath });
    imfs.mkdirpSync(path.dirname(inputPath));
    imfs.writeFileSync(inputPath, options.inputCode!, 'utf-8');
  } else {
    inputPath = path.resolve(options.inputPath!);
    if (!shelljs.test('-f', inputPath)) {
      throw new Error(`Cannot find inputPath '${options.inputPath}'.`);
    }
  }
  webpackConfig.entry = inputPath;

  let outputPath: string;
  if (omfs) {
    outputPath = path.resolve(options.outputCodePath!);
  } else {
    outputPath = path.resolve(options.outputPath!);
  }
  Object.assign(webpackConfig.output, {
    libraryTarget: 'umd',
    path: path.dirname(outputPath),
    filename: path.basename(outputPath),
  });

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

  const resolveExtensions = webpackConfig.resolve?.extensions ?? [];
  const outputPathParsed = path.parse(outputPath);
  if (resolveExtensions.includes(outputPathParsed.ext)) {
    outputPathParsed.ext = '.js';
    outputPathParsed.base = `${outputPathParsed.name}${outputPathParsed.ext}`;
    outputPath = path.format(outputPathParsed);
    Object.assign(webpackConfig.output, { filename: outputPathParsed.base });
  }

  // Create webpack compiler and execute
  const webpackCompiler = pify(webpack(webpackConfig));
  if (imfs) {
    webpackCompiler.inputFileSystem = imfs;
  }
  if (omfs) {
    webpackCompiler.outputFileSystem = omfs;
  }

  const webpackStats: webpack.Stats = await webpackCompiler.run();

  const hasErrors = webpackStats.hasErrors();

  let outputCode: string = '';
  if (!hasErrors) {
    if (omfs) {
      outputCode = omfs.readFileSync(outputPath, 'utf-8');
    }
  }

  // Destroy memory file system if created
  if (imfs) {
    imfs.unlinkSync(inputPath);
    delete imfs.data;
  }

  if (!hasErrors) {
    if (omfs) {
      omfs.unlinkSync(outputPath);
      delete omfs.data;
    }
  }

  if (hasErrors) {
    throw new Error(`Compilation failed with messages:\n${webpackStats.toString('errors-only')}`);
  }

  // Normalize source map when available
  try {
    const devtool = webpackConfig.devtool;

    if (typeof devtool != 'string' || !devtool.includes('source-map') || devtool.includes('eval')) {
      throw 0;
    }

    const isInline = devtool.includes('inline');

    if (omfs && !isInline) {
      throw 0;
    }

    const inputSource: string = omfs ? outputCode : await pify(fs).readFile(outputPath, 'utf-8');

    // Read raw source map
    let rawSourceMap: RawSourceMap;
    if (isInline) {
      rawSourceMap = JSON.parse(
        Buffer.from(
          inputSource.substring(inputSource.lastIndexOf('\n')).split('base64,')[1],
          'base64'
        ).toString('utf-8')
      );
    } else {
      rawSourceMap = JSON.parse(await pify(fs).readFile(outputPath + '.map', 'utf-8'));
    }

    // Make new source map
    const newSourceMap = await SourceMapConsumer.with(rawSourceMap, null, async consumer => {
      const generator = new SourceMapGenerator({
        file: rawSourceMap.file,
        sourceRoot: rawSourceMap.sourceRoot,
        skipValidation: true,
      });
      consumer.eachMapping(m => {
        if (m.source != inputPath) {
          return;
        }
        generator.addMapping({
          source: m.source,
          name: m.name,
          generated: { line: m.generatedLine, column: m.generatedColumn },
          original: { line: m.originalLine, column: m.originalColumn },
        });
      });
      return generator.toString();
    });

    // Write new source map
    if (isInline) {
      const outputSource =
        inputSource.substring(
          0,
          inputSource.indexOf('base64,', inputSource.lastIndexOf('\n')) + 7
        ) + Buffer.from(newSourceMap, 'utf-8').toString('base64');
      if (omfs) {
        outputCode = outputSource;
      } else {
        await pify(fs).writeFile(outputPath, outputSource);
      }
    } else {
      await pify(fs).writeFile(outputPath + '.map', newSourceMap);
    }
  } catch {}

  return outputCode;
}

function correctInputMemoryFileSystem(imfs: MemoryFileSystem, options: { inputPath: string }) {
  const imfsReadFile = imfs.readFile.bind(imfs);
  const imfsStat = imfs.stat.bind(imfs);
  Object.assign(imfs, {
    readFile(...args: Parameters<typeof imfs.readFile>) {
      return args[0] == options.inputPath ? imfsReadFile(...args) : fs.readFile(...args);
    },
    stat(...args: Parameters<typeof imfs.stat>) {
      return args[0] == options.inputPath ? imfsStat(...args) : fs.stat(...args);
    },
  });
}

export default transpile;
