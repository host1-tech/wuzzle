import findUp from 'find-up';
import path from 'path';
import shelljs from 'shelljs';
import transpile, { TranspileOptions } from '.';

const packageJsonPath = findUp.sync('package.json', { cwd: __filename })!;
const projectPath = path.dirname(packageJsonPath);
const fixturePath = path.resolve(projectPath, '__tests__/fixtures/wuzzle-transpile');

describe('src/transpile', () => {
  beforeAll(() => shelljs.cd(fixturePath));

  describe.each([
    ['code', 'code'],
    ['code', 'file'],
    ['file', 'code'],
    ['file', 'file'],
  ])('when converting %s to %s', (inputMethod, outputMethod) => {
    const isCodeInput = inputMethod == 'code';
    const isCodeOutput = outputMethod == 'code';
    const inputPath = 'src/index.js';
    const outputPath = 'lib/index.js';

    let outputCode: string;
    let outputContent: string;

    beforeAll(async () => {
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
      expect(outputContent).toMatch(/["']\.\/message["']/);
      expect(outputContent).toMatch(/["']chalk["']/);
    });

    it('excludes required modules', () => {
      expect(outputContent).not.toContain('Hi, WT.');
      expect(outputContent).not.toContain('ansi256');
    });
  });

  describe('when given same input content', () => {
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
});
