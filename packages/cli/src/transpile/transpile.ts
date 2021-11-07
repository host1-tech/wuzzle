import cacache from 'cacache';
import { createHash } from 'crypto';
import fs from 'fs';
import glob from 'glob';
import { flatten, uniq } from 'lodash';
import MemoryFileSystem from 'memory-fs';
import minimatch from 'minimatch';
import pMap from 'p-map';
import path from 'path';
import pify from 'pify';
import serializeJavascript from 'serialize-javascript';
import { RawSourceMap, SourceMapConsumer, SourceMapGenerator } from 'source-map';
import { promisify } from 'util';
import webpack from 'webpack';
import { merge } from 'webpack-merge';
import mkdirp from 'mkdirp';
import applyConfig from '../apply-config';
import {
  CACHE_BASE_PATH,
  CACHE_KEY_DEFAULT_OF_ENV_KEYS,
  CACHE_KEY_DEFAULT_OF_FILE_PATHS,
  EK_CACHE_KEY_OF_ENV_KEYS,
  EK_CACHE_KEY_OF_FILE_PATHS,
  EK_PROJECT_PATH,
  ENCODING_TEXT,
} from '../constants';
import { waitForStream } from '../utils';

export type TranspileOptions = Partial<TranspileInternalOptions>;

export interface TranspileInternalOptions {
  inputPath?: string;
  inputCode: string;
  inputCodePath: string;
  outputPath?: string;
  outputCodePath: string;
  autoResolveOutputExt: boolean;
  webpackConfig: webpack.Configuration;
}

export const transpileDefaultOptions: TranspileInternalOptions = {
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
    optimization: {
      nodeEnv: false,
    },
  },
};

export const thisFileContent = fs.readFileSync(__filename);
export const cachePath = path.join(CACHE_BASE_PATH, 'transpile');

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
    imfs.writeFileSync(inputPath, internalOptions.inputCode, ENCODING_TEXT);
  } else {
    inputPath = path.resolve(internalOptions.inputPath!);
    try {
      fs.accessSync(inputPath, fs.constants.R_OK);
    } catch {
      throw new Error(`Cannot find inputPath '${options.inputPath}'`);
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
      if (request === inputPath) {
        callback();
      } else {
        callback(null, `commonjs ${request}`);
      }
    },
  ];

  applyConfig(webpackConfig, webpack);

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

  // Get output from cache
  const outputCacheKey = await generateCacheKey(internalOptions);
  try {
    if (omfs) {
      return (await cacache.get(cachePath, outputCacheKey)).data.toString(ENCODING_TEXT);
    } else {
      if (!(await cacache.get.info(cachePath, outputCacheKey))) throw 0;
      await mkdirp(path.dirname(outputPath));
      await waitForStream(
        cacache.get.stream(cachePath, outputCacheKey).pipe(fs.createWriteStream(outputPath))
      );
      if (doesProduceFileSourceMap(webpackConfig.devtool)) {
        if (!(await cacache.get.info(cachePath, addSourceMapPathExt(outputCacheKey)))) throw 0;
        await waitForStream(
          cacache.get
            .stream(cachePath, addSourceMapPathExt(outputCacheKey))
            .pipe(fs.createWriteStream(addSourceMapPathExt(outputPath)))
        );
      }
      return '';
    }
  } catch {}

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
      outputCode = omfs.readFileSync(outputPath, ENCODING_TEXT);
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
    if (!doesProduceSourceMap(webpackConfig.devtool)) {
      throw 0;
    }

    if (omfs && doesProduceFileSourceMap(webpackConfig.devtool)) {
      // Remove source map url
      outputCode = outputCode.substring(0, outputCode.lastIndexOf('\n'));
      throw 0;
    }

    const inputSource: string = omfs
      ? outputCode
      : await pify(fs).readFile(outputPath, ENCODING_TEXT);

    // Read raw source map
    let rawSourceMap: RawSourceMap;
    if (doesProduceInlineSourceMap(webpackConfig.devtool)) {
      rawSourceMap = JSON.parse(
        Buffer.from(
          inputSource.substring(inputSource.lastIndexOf('\n')).split('base64,')[1],
          'base64'
        ).toString(ENCODING_TEXT)
      );
    } else {
      rawSourceMap = JSON.parse(
        await pify(fs).readFile(addSourceMapPathExt(outputPath), ENCODING_TEXT)
      );
    }

    // Make new source map
    const newSourceMap = await SourceMapConsumer.with(rawSourceMap, null, async consumer => {
      const generator = new SourceMapGenerator({
        file: rawSourceMap.file,
        sourceRoot: rawSourceMap.sourceRoot,
        skipValidation: true,
      });
      consumer.eachMapping(m => {
        if (m.source !== inputPath) {
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
    if (doesProduceInlineSourceMap(webpackConfig.devtool)) {
      const outputSource =
        inputSource.substring(
          0,
          inputSource.indexOf('base64,', inputSource.lastIndexOf('\n')) + 'base64,'.length
        ) + Buffer.from(newSourceMap, ENCODING_TEXT).toString('base64');
      if (omfs) {
        outputCode = outputSource;
      } else {
        await pify(fs).writeFile(outputPath, outputSource);
      }
    } else {
      await pify(fs).writeFile(addSourceMapPathExt(outputPath), newSourceMap);
    }
  } catch {}

  // Put output into cache
  if (omfs) {
    await cacache.put(cachePath, outputCacheKey, outputCode);
  } else {
    await waitForStream(
      fs.createReadStream(outputPath).pipe(cacache.put.stream(cachePath, outputCacheKey))
    );
    if (doesProduceFileSourceMap(webpackConfig.devtool)) {
      await waitForStream(
        fs
          .createReadStream(addSourceMapPathExt(outputPath))
          .pipe(cacache.put.stream(cachePath, addSourceMapPathExt(outputCacheKey)))
      );
    }
  }

  return outputCode;
}

export function correctInputMemoryFileSystem(
  imfs: MemoryFileSystem,
  options: { inputPath: string }
) {
  const targetMethods = ['readFile', 'readFileSync', 'stat', 'statSync'] as const;
  targetMethods.forEach(method => {
    const imfsMethod = imfs[method].bind(imfs) as Function;
    const fsMethod = fs[method] as Function;
    imfs[method] = (...args: unknown[]) => {
      return args[0] === options.inputPath ? imfsMethod(...args) : fsMethod(...args);
    };
  });
}

export function addSourceMapPathExt(name: string): string {
  return name + '.map';
}

export async function generateCacheKey(options: TranspileOptions): Promise<string> {
  let cacheKeyOfEnvKeys = CACHE_KEY_DEFAULT_OF_ENV_KEYS;
  try {
    cacheKeyOfEnvKeys = JSON.parse(process.env[EK_CACHE_KEY_OF_ENV_KEYS]!);
  } catch {}
  const envKeys = Object.keys(process.env).filter(k =>
    cacheKeyOfEnvKeys.some(g => minimatch(k, g))
  );
  const envVals = envKeys.map(k => process.env[k]);

  let cacheKeyOfFilePaths = CACHE_KEY_DEFAULT_OF_FILE_PATHS;
  try {
    cacheKeyOfFilePaths = JSON.parse(process.env[EK_CACHE_KEY_OF_FILE_PATHS]!);
  } catch {}
  const filePaths = uniq(
    flatten(
      await pMap(
        cacheKeyOfFilePaths,
        g =>
          promisify(glob)(g, {
            cwd: process.env[EK_PROJECT_PATH],
            dot: true,
            nodir: true,
            absolute: true,
          }),
        { stopOnError: true }
      )
    )
  );
  const fileContents = await pMap(filePaths, f => promisify(fs.readFile)(f, ENCODING_TEXT), {
    stopOnError: true,
  });

  return createHash('md5')
    .update(thisFileContent)
    .update('\0', ENCODING_TEXT)
    .update(serializeJavascript(options))
    .update('\0', ENCODING_TEXT)
    .update(serializeJavascript(envKeys))
    .update('\0', ENCODING_TEXT)
    .update(serializeJavascript(envVals))
    .update('\0', ENCODING_TEXT)
    .update(serializeJavascript(filePaths))
    .update('\0', ENCODING_TEXT)
    .update(serializeJavascript(fileContents))
    .digest('hex');
}

export function doesProduceSourceMap(devtool?: webpack.Options.Devtool): boolean {
  return typeof devtool === 'string' && !devtool.includes('eval') && devtool.includes('source-map');
}

export function doesProduceInlineSourceMap(devtool?: webpack.Options.Devtool): boolean {
  return doesProduceSourceMap(devtool) && String(devtool).includes('inline');
}

export function doesProduceFileSourceMap(devtool?: webpack.Options.Devtool): boolean {
  return doesProduceSourceMap(devtool) && !String(devtool).includes('inline');
}
