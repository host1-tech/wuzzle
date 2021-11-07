import cacache from 'cacache';
import path from 'path';
import shelljs from 'shelljs';
import { mocked } from 'ts-jest/utils';
import webpack from 'webpack';
import {
  EK_CACHE_KEY_OF_ENV_KEYS,
  EK_CACHE_KEY_OF_FILE_PATHS,
  EK_PROJECT_PATH,
  ENCODING_TEXT,
} from '../constants';
import { cachePath, transpile, generateCacheKey } from './transpile';
import fs from 'fs';

const fixturePath = path.join(__dirname, 'fixtures');
const outputDir = 'lib';
const printJs = {
  inputPath: 'src/print.js',
  outputPath: `${outputDir}/print.js`,
};
const throwJs = {
  inputPath: 'src/throw.js',
};
const emptyTs = {
  inputPath: 'src/empty.ts',
  outputPath: `${outputDir}/empty.ts`,
};
const changingJs = {
  inputPath: 'src/changing.js',
  outputPath: `${outputDir}/changing.js`,
};
const babelConfPath = path.join(fixturePath, '.babelrc');

process.env[EK_PROJECT_PATH] = fixturePath;

jest.spyOn(cacache.get, 'info');

jest.mock('webpack', () => {
  const webpack = jest.requireActual('webpack');
  return {
    __esModule: true,
    default: jest.fn((...params) => webpack(...params)),
  };
});

jest.mock('../apply-config');

jest.mock('../constants', () => {
  const constants = jest.requireActual('../constants');
  return {
    ...constants,
    CACHE_BASE_PATH: path.join(__dirname, 'fixtures/node_modules/.cache', constants.PKG_NAME),
  };
});

beforeAll(() => {
  shelljs.cd(fixturePath);
});

describe('transpile', () => {
  beforeAll(() => {
    shelljs.rm('-fr', cachePath);
  });

  beforeEach(() => {
    shelljs.rm('-fr', outputDir);
    jest.clearAllMocks();
  });

  it('converts code to code', async () => {
    const outputContent = await transpile({ inputCode: shelljs.cat(printJs.inputPath).stdout });
    expect(webpack).toBeCalled();
    expectPrintJsOutputContentToBeGood(outputContent);
  });

  it('converts file to code', async () => {
    const outputContent = await transpile({ inputPath: printJs.inputPath });
    expect(webpack).toBeCalled();
    expectPrintJsOutputContentToBeGood(outputContent);
  });

  it('converts code to file', async () => {
    await transpile({
      inputCode: shelljs.cat(printJs.inputPath).stdout,
      outputPath: printJs.outputPath,
    });
    const outputContent = shelljs.cat(printJs.outputPath).stdout;
    expect(webpack).toBeCalled();
    expectPrintJsOutputContentToBeGood(outputContent);
  });

  it('converts file to file', async () => {
    await transpile({
      inputPath: printJs.inputPath,
      outputPath: printJs.outputPath,
    });
    const outputContent = shelljs.cat(printJs.outputPath).stdout;
    expect(webpack).toBeCalled();
    expectPrintJsOutputContentToBeGood(outputContent);
  });

  it('works with default options', async () => {
    const outputContent = await transpile();
    expect(webpack).toBeCalled();
    expect(outputContent).toEqual(expect.stringContaining('__webpack_require__'));
  });

  it('throws error on input path not found', async () => {
    const inputPath = '/path/not/found';
    let error: any;
    try {
      await transpile({ inputPath });
    } catch (e) {
      error = e;
    }
    expect(error.message).toEqual(expect.stringContaining(inputPath));
  });

  it('throws error on compilation failure', async () => {
    let error: any;
    try {
      await transpile({ inputPath: throwJs.inputPath });
    } catch (e) {
      error = e;
    }
    expect(error.message).toContain(`Compilation failed with messages:`);
  });

  it('auto resolves output ext by default', async () => {
    await transpile({
      inputPath: emptyTs.inputPath,
      outputPath: emptyTs.outputPath,
      webpackConfig: { resolve: { extensions: ['.js', '.ts'] } },
    });
    expect(
      shelljs.test('-f', emptyTs.outputPath.slice(0, emptyTs.outputPath.lastIndexOf('.')) + '.js')
    ).toBe(true);
  });

  it('should not resolve output ext if disabled', async () => {
    await transpile({
      inputPath: emptyTs.inputPath,
      outputPath: emptyTs.outputPath,
      autoResolveOutputExt: false,
      webpackConfig: { resolve: { extensions: ['.js', '.ts'] } },
    });
    expect(shelljs.test('-f', emptyTs.outputPath)).toBe(true);
  });

  it('corrects source map file of output file', async () => {
    await transpile({
      inputPath: printJs.inputPath,
      outputPath: printJs.outputPath,
      webpackConfig: { devtool: 'source-map' },
    });
    expect(JSON.parse(shelljs.cat(printJs.outputPath + '.map').stdout).sources).toEqual([
      path.resolve(printJs.inputPath),
    ]);
  });

  it('removes source map url of output code', async () => {
    const outputContent = await transpile({
      inputPath: printJs.inputPath,
      webpackConfig: { devtool: 'source-map' },
    });
    expect(outputContent.substr(outputContent.lastIndexOf('\n'))).toEqual(
      expect.not.stringContaining('sourceMappingURL')
    );
  });

  it('corrects inline source map of output file', async () => {
    await transpile({
      inputPath: printJs.inputPath,
      outputPath: printJs.outputPath,
      webpackConfig: { devtool: 'inline-source-map' },
    });
    expect(JSON.parse(readInlineSourceMap(shelljs.cat(printJs.outputPath).stdout)).sources).toEqual(
      [path.resolve(printJs.inputPath)]
    );
  });

  it('corrects inline source map of output code', async () => {
    const outputContent = await transpile({
      inputPath: printJs.inputPath,
      webpackConfig: { devtool: 'inline-source-map' },
    });
    expect(JSON.parse(readInlineSourceMap(outputContent)).sources).toEqual([
      path.resolve(printJs.inputPath),
    ]);
  });

  it('reads cache to output code if cached', async () => {
    const outputContent = await transpile({ inputCode: shelljs.cat(printJs.inputPath).stdout });
    expect(webpack).not.toBeCalled();
    expectPrintJsOutputContentToBeGood(outputContent);
  });

  it('reads cache to output bundle file if cached', async () => {
    await transpile({
      inputPath: printJs.inputPath,
      outputPath: printJs.outputPath,
    });
    const outputContent = shelljs.cat(printJs.outputPath).stdout;
    expect(webpack).not.toBeCalled();
    expectPrintJsOutputContentToBeGood(outputContent);
  });

  it('reads cache to output bundle file and its source map if all cached', async () => {
    await transpile({
      inputPath: printJs.inputPath,
      outputPath: printJs.outputPath,
      webpackConfig: { devtool: 'source-map' },
    });
    const outputContent = shelljs.cat(printJs.outputPath).stdout;
    expect(webpack).not.toBeCalled();
    expectPrintJsOutputContentToBeGood(outputContent);
    expect(JSON.parse(shelljs.cat(printJs.outputPath + '.map').stdout).sources).toEqual([
      path.resolve(printJs.inputPath),
    ]);
  });

  it('compiles to output bundle file and its source map if source map not cached', async () => {
    [{}, null].forEach(o => mocked(cacache.get.info).mockResolvedValueOnce(o as never));
    await transpile({
      inputPath: printJs.inputPath,
      outputPath: printJs.outputPath,
      webpackConfig: { devtool: 'source-map' },
    });
    const outputContent = shelljs.cat(printJs.outputPath).stdout;
    expect(webpack).toBeCalled();
    expectPrintJsOutputContentToBeGood(outputContent);
    expect(JSON.parse(shelljs.cat(printJs.outputPath + '.map').stdout).sources).toEqual([
      path.resolve(printJs.inputPath),
    ]);
  });

  function expectPrintJsOutputContentToBeGood(outputContent: string) {
    ['__webpack_require__', 'console.log', 'Hi,'].forEach(s =>
      expect(outputContent).toEqual(expect.stringContaining(s))
    );
    ['I am a dep.', 'We are constants.'].forEach(s =>
      expect(outputContent).toEqual(expect.not.stringContaining(s))
    );
  }

  function readInlineSourceMap(outputContent: string) {
    return Buffer.from(
      outputContent.substring(outputContent.lastIndexOf('\n')).split('base64,')[1],
      'base64'
    ).toString(ENCODING_TEXT);
  }
});

describe('generateCacheKey', () => {
  beforeEach(() => {
    delete process.env[EK_CACHE_KEY_OF_ENV_KEYS];
    delete process.env[EK_CACHE_KEY_OF_FILE_PATHS];
    delete process.env.BABEL_ENV;
  });

  it('changes on input file content change', async () => {
    fs.writeFileSync(changingJs.inputPath, '1;');
    const hash1 = await generateCacheKey({ inputPath: changingJs.inputPath });
    fs.writeFileSync(changingJs.inputPath, '2;');
    const hash2 = await generateCacheKey({ inputPath: changingJs.inputPath });
    expect(hash1).not.toBe(hash2);
  });

  it('changes on options change', async () => {
    const hash1 = await generateCacheKey({ inputCode: '1;' });
    const hash2 = await generateCacheKey({ inputCode: '2;' });
    expect(hash1).not.toBe(hash2);
  });

  it('changes on inspected envs change', async () => {
    process.env.BABEL_ENV = 'production';
    const hash1 = await generateCacheKey({});
    process.env.BABEL_ENV = 'development';
    const hash2 = await generateCacheKey({});
    expect(hash1).not.toBe(hash2);
  });

  it('changes on inspected files change', async () => {
    fs.writeFileSync(babelConfPath, JSON.stringify({ v: 1 }));
    const hash1 = await generateCacheKey({});
    fs.writeFileSync(babelConfPath, JSON.stringify({ v: 2 }));
    const hash2 = await generateCacheKey({});
    expect(hash1).not.toBe(hash2);
  });

  it(`sets inspected envs by "${EK_CACHE_KEY_OF_ENV_KEYS}"`, async () => {
    process.env[EK_CACHE_KEY_OF_ENV_KEYS] = JSON.stringify([]);
    process.env.BABEL_ENV = 'production';
    const hash1 = await generateCacheKey({});
    process.env.BABEL_ENV = 'development';
    const hash2 = await generateCacheKey({});
    expect(hash1).toBe(hash2);
  });

  it(`sets inspected files by "${EK_CACHE_KEY_OF_FILE_PATHS}"`, async () => {
    process.env[EK_CACHE_KEY_OF_FILE_PATHS] = JSON.stringify([]);
    fs.writeFileSync(babelConfPath, JSON.stringify({ v: 1 }));
    const hash1 = await generateCacheKey({});
    fs.writeFileSync(babelConfPath, JSON.stringify({ v: 2 }));
    const hash2 = await generateCacheKey({});
    expect(hash1).toBe(hash2);
  });
});
