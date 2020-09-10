import path from 'path';
import shelljs from 'shelljs';
import transpile from '../src/transpile';

describe('@wuzzle/cli - transpile', () => {
  beforeAll(() => {
    shelljs.cd(path.resolve(__dirname, 'fixtures/wuzzle-transpile'));
  });

  it('should convert code to code', async () => {
    const inputCode = shelljs.cat('src/index.js').stdout;
    const outputCode = await transpile({ inputCode });
    expect(outputCode).toContain('console.log');
  });

  it('should convert code to file', async () => {
    const inputCode = shelljs.cat('src/index.js').stdout;
    const outputPath = 'out/index.js';
    await transpile({ inputCode, outputPath });
    expect(shelljs.test('-f', outputPath)).toBeTruthy();
    const outputCode = shelljs.cat(outputPath).stdout;
    expect(outputCode).toContain('console.log');
  });

  it('should convert file to code', async () => {
    const inputPath = 'src/index.js';
    const outputCode = await transpile({ inputPath });
    expect(outputCode).toContain('console.log');
  });

  it('should convert file to file', async () => {
    const outputPath = 'out/index.js';
    await transpile({ inputPath: 'src/index.js', outputPath });
    expect(shelljs.test('-f', outputPath)).toBeTruthy();
    const outputCode = shelljs.cat(outputPath).stdout;
    expect(outputCode).toContain('console.log');
  });
});
