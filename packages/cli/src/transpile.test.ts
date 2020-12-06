import findUp from 'find-up';
import path from 'path';
import shelljs from 'shelljs';
import { RawSourceMap } from 'source-map';
import webpack from 'webpack';
import transpile, { TranspileOptions } from './transpile';

const projectPath = path.dirname(findUp.sync('package.json', { cwd: __filename })!);
const fixturePath = path.resolve(projectPath, '__tests__/fixtures/wuzzle-transpile-api');

const inputPath = 'src/index.js';
const outputPath = 'lib/index.js';

enum IOMethod {
  CODE = 'code',
  FILE = 'file',
}

describe('src/transpile', () => {
  beforeAll(() => shelljs.cd(fixturePath));

  it('outputs code when giving default options', async () => {
    const outputCode = await transpile();
    expect(outputCode).toContain('__webpack_require__');
  });

  it('throws error when input path not found', async () => {
    const inputPath = 'inexistent/input/path.js';
    let error;
    try {
      await transpile({ inputPath });
    } catch (e) {
      error = e;
    }
    expect(error?.message).toContain(`Cannot find inputPath '${inputPath}'`);
  });

  it('throws error when compilation failure', async () => {
    const inputPath = 'src/throw.js';
    let error;
    try {
      await transpile({ inputPath });
    } catch (e) {
      error = e;
    }
    expect(error?.message).toContain(`Compilation failed with messages`);
  });

  describe.each([
    [IOMethod.CODE, IOMethod.CODE],
    [IOMethod.CODE, IOMethod.FILE],
    [IOMethod.FILE, IOMethod.CODE],
    [IOMethod.FILE, IOMethod.FILE],
  ])('when converting %s to %s', (inputMethod, outputMethod) => {
    const isCodeInput = inputMethod == IOMethod.CODE;
    const isCodeOutput = outputMethod == IOMethod.CODE;

    let outputCode: string;
    let outputContent: string;

    it('executes', async () => {
      const transpileOptions: TranspileOptions = {};

      if (isCodeInput) {
        const inputCode = shelljs.cat(inputPath).stdout;
        const inputCodePath = inputPath;
        Object.assign(transpileOptions, { inputCode, inputCodePath });
      } else {
        Object.assign(transpileOptions, { inputPath });
      }

      if (isCodeOutput) {
        const outputCodePath = outputPath;
        Object.assign(transpileOptions, { outputCodePath });
      } else {
        Object.assign(transpileOptions, { outputPath });
      }

      shelljs.rm('-f', outputPath);
      outputCode = await transpile(transpileOptions);

      if (isCodeOutput) {
        outputContent = outputCode;
      } else {
        outputContent = shelljs.cat(outputPath).stdout;
      }
    });

    if (isCodeOutput) {
      it(`outputs code only`, () => {
        expect(outputCode).toBeTruthy();
        expect(shelljs.test('-f', outputPath)).toBe(false);
      });
    } else {
      it(`outputs file only`, () => {
        expect(outputCode).toBeFalsy();
        expect(shelljs.test('-f', outputPath)).toBe(true);
      });
    }

    it('keeps member expressions', () => {
      expect(outputContent).toContain('.log');
      expect(outputContent).toContain('.green');
    });

    it('keeps string literals', () => {
      expect(outputContent).toMatch(/["']\.\/constants["']/);
      expect(outputContent).toMatch(/["']chalk["']/);
    });

    it('excludes required modules', () => {
      expect(outputContent).not.toContain('Hi, WT.');
      expect(outputContent).not.toContain('ansi256');
    });
  });

  describe('when giving same input content', () => {
    it('always outputs same content', async () => {
      const inputPath = 'src/index.js';
      const outputPath = 'lib/index.js';
      const inputCode = shelljs.cat(inputPath).stdout;
      const inputCodePath = inputPath;
      const outputCodePath = outputPath;

      const outputContents: string[] = [];

      outputContents.push(await transpile({ inputCode, inputCodePath, outputCodePath }));

      outputContents.push(await transpile({ inputPath, outputCodePath }));

      shelljs.rm('-f', outputPath);
      await transpile({ inputCode, inputCodePath, outputPath });
      outputContents.push(shelljs.cat(outputPath).stdout);

      shelljs.rm('-f', outputPath);
      await transpile({ inputPath, outputPath });
      outputContents.push(shelljs.cat(outputPath).stdout);

      outputContents.reduce((c1, c2) => (expect(c1 == c2).toBe(true), c2));
    });
  });

  describe.each<[IOMethod, webpack.Options.Devtool]>([
    [IOMethod.CODE, 'source-map'],
    [IOMethod.CODE, 'inline-source-map'],
    [IOMethod.FILE, 'source-map'],
    [IOMethod.FILE, 'inline-source-map'],
  ])('when outputing %s with %s', (outputMethod, devtool) => {
    const isCodeOutput = outputMethod == IOMethod.CODE;
    const isInline = typeof devtool == 'string' && devtool.includes('inline');

    let rawSourceMap: RawSourceMap | null = null;

    it('executes', async () => {
      const transpileOptions: TranspileOptions = { inputPath, webpackConfig: { devtool } };

      if (isCodeOutput) {
        const outputCodePath = outputPath;
        Object.assign(transpileOptions, { outputCodePath });
      } else {
        Object.assign(transpileOptions, { outputPath });
      }

      const outputMapPath = outputPath + '.map';

      shelljs.rm('-fr', outputMapPath);

      const outputCode = await transpile(transpileOptions);
      const outputContent = isCodeOutput ? outputCode : shelljs.cat(outputPath).stdout;

      if (isInline) {
        rawSourceMap = JSON.parse(
          Buffer.from(
            outputContent.substring(outputContent.lastIndexOf('\n')).split('base64,')[1],
            'base64'
          ).toString('utf-8')
        );
      } else {
        if (shelljs.test('-f', outputMapPath)) {
          rawSourceMap = JSON.parse(shelljs.cat(outputMapPath).stdout);
        }
      }
    });

    it('outputs valid source map', () => {
      if (isCodeOutput && !isInline) {
        expect(rawSourceMap).toBeNull();
      } else {
        expect(rawSourceMap?.sources).toEqual([path.resolve(inputPath)]);
      }
    });
  });
});
