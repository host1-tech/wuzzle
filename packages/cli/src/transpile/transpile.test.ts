import path from 'path';
import shelljs from 'shelljs';
import { ENCODING_TEXT } from '../constants';
import { transpile } from './transpile';

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

jest.mock('../apply-config');

describe('transpile', () => {
  beforeAll(() => shelljs.cd(fixturePath));

  beforeEach(() => {
    shelljs.rm('-fr', outputDir);
  });

  it('converts code to code', async () => {
    const outputCode = await transpile({ inputCode: shelljs.cat(printJs.inputPath).stdout });
    expectPrintJsOutputContentToBeGood(outputCode);
  });

  it('converts file to code', async () => {
    const outputCode = await transpile({ inputPath: printJs.inputPath });
    expectPrintJsOutputContentToBeGood(outputCode);
  });

  it('converts code to file', async () => {
    await transpile({
      inputCode: shelljs.cat(printJs.inputPath).stdout,
      outputPath: printJs.outputPath,
    });
    expectPrintJsOutputContentToBeGood(shelljs.cat(printJs.outputPath).stdout);
  });

  it('converts file to file', async () => {
    await transpile({
      inputPath: printJs.inputPath,
      outputPath: printJs.outputPath,
    });
    expectPrintJsOutputContentToBeGood(shelljs.cat(printJs.outputPath).stdout);
  });

  it('works with default options', async () => {
    const outputCode = await transpile();
    expect(outputCode).toEqual(expect.stringContaining('__webpack_require__'));
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
    const outputCode = await transpile({
      inputPath: printJs.inputPath,
      webpackConfig: { devtool: 'source-map' },
    });
    expect(outputCode.substr(outputCode.lastIndexOf('\n'))).toEqual(
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
    const outputCode = await transpile({
      inputPath: printJs.inputPath,
      webpackConfig: { devtool: 'inline-source-map' },
    });
    expect(JSON.parse(readInlineSourceMap(outputCode)).sources).toEqual([
      path.resolve(printJs.inputPath),
    ]);
  });
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
