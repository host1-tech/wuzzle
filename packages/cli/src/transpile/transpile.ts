import fs from 'fs';
import MemoryFileSystem from 'memory-fs';
import path from 'path';
import pify from 'pify';
import { RawSourceMap, SourceMapConsumer, SourceMapGenerator } from 'source-map';
import webpack from 'webpack';
import { merge } from 'webpack-merge';
import applyConfig from '../apply-config';

export type TranspileOptions = Partial<TranspileInternalOptions>;

interface TranspileInternalOptions {
  inputPath?: string;
  inputCode: string;
  inputCodePath: string;
  outputPath?: string;
  outputCodePath: string;
  autoResolveOutputExt: boolean;
  webpackConfig: webpack.Configuration;
}

const transpileDefaultOptions: TranspileInternalOptions = {
  inputCode: '',
  inputCodePath: 'index.js',
  outputCodePath: 'index.js',
  autoResolveOutputExt: true,
  webpackConfig: {
    output: {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    },
    target: 'node',
    mode: 'development',
    node: false,
  },
};

export async function transpile(options: TranspileOptions = {}): Promise<string> {
  const internalOptions: TranspileInternalOptions = {
    ...transpileDefaultOptions,
    ...options,
    webpackConfig: merge(transpileDefaultOptions.webpackConfig, options.webpackConfig || {}),
  };

  const imfs = !internalOptions.inputPath && new MemoryFileSystem();
  const omfs = !internalOptions.outputPath && new MemoryFileSystem();

  // Tweak webpack config and apply wuzzle config
  const { webpackConfig } = internalOptions;

  let inputPath: string;
  if (imfs) {
    inputPath = path.resolve(internalOptions.inputCodePath);
    correctInputMemoryFileSystem(imfs, { inputPath });
    imfs.mkdirpSync(path.dirname(inputPath));
    imfs.writeFileSync(inputPath, internalOptions.inputCode, 'utf-8');
  } else {
    inputPath = path.resolve(internalOptions.inputPath!);
    try {
      fs.accessSync(inputPath, fs.constants.R_OK);
    } catch {
      throw new Error(`Cannot find inputPath '${options.inputPath}'.`);
    }
  }
  webpackConfig.entry = inputPath;

  let outputPath: string;
  if (omfs) {
    outputPath = path.resolve(internalOptions.outputCodePath);
  } else {
    outputPath = path.resolve(internalOptions.outputPath!);
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

  if (internalOptions.autoResolveOutputExt) {
    const extensionsToResolve = webpackConfig.resolve?.extensions ?? [];
    const outputPathParsed = path.parse(outputPath);
    if (extensionsToResolve.includes(outputPathParsed.ext)) {
      outputPathParsed.ext = '.js';
      outputPathParsed.base = `${outputPathParsed.name}${outputPathParsed.ext}`;
      outputPath = path.format(outputPathParsed);
      Object.assign(webpackConfig.output, { filename: outputPathParsed.base });
    }
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
    const { devtool } = webpackConfig;

    if (
      typeof devtool !== 'string' ||
      devtool.includes('eval') ||
      !devtool.includes('source-map')
    ) {
      throw 0;
    }

    const isInline = devtool.includes('inline');

    if (omfs && !isInline) {
      // Remove source map url
      outputCode = outputCode.substring(0, outputCode.lastIndexOf('\n'));
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
          inputSource.indexOf('base64,', inputSource.lastIndexOf('\n')) + 'base64,'.length
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
  const targetMethods = ['readFile', 'readFileSync', 'stat', 'statSync'] as const;
  targetMethods.forEach(method => {
    const imfsMethod = imfs[method].bind(imfs) as Function;
    const fsMethod = fs[method] as Function;
    imfs[method] = (...args: unknown[]) => {
      return args[0] === options.inputPath ? imfsMethod(...args) : fsMethod(...args);
    };
  });
}
