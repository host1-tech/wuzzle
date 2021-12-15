import glob from 'glob';
import path from 'path';
import shelljs from 'shelljs';
import { concatEnvPath, genEndToEndExec } from '../utils';

export interface TestCase {
  fixtureDir: string;
  command: string;
  envOverrides?: Record<string, string>;
  outputDir?: string;
  outputContents?: Record<string, string>;
  outputMessages?: string[];
  skipNormal?: boolean;
  testGlobal?: boolean | 'with-install';
  testDryRun?: boolean;
  testUnregister?: boolean;
  only?: boolean;
  skip?: boolean;
}

export type TestCasesInGroups = Record<string, Record<string, TestCase>>;

export const testTimeout = 60000;
export const globalDirName = 'test-as-global';
export const wuzzleMountingText = 'Wuzzle process mounted in CWD:';
export const silent = true;

export function executeTests(testCasesInGroups: TestCasesInGroups): void {
  describe.each(Object.keys(testCasesInGroups))(`feasibility check on 'wuzzle %s'`, packageDesc => {
    const fixtureInfo = testCasesInGroups[packageDesc];
    const moduleName = packageDesc.split(' ')[0];

    Object.keys(fixtureInfo).forEach(versionFlag => {
      const {
        fixtureDir,
        command,
        envOverrides,
        outputDir,
        outputContents,
        outputMessages,
        skipNormal,
        testGlobal,
        testDryRun,
        testUnregister,
        only,
        skip,
      } = fixtureInfo[versionFlag];
      const commandName = command.split(' ')[0];
      const globalDir = path.join(fixtureDir, globalDirName);
      const originalEnvPath = process.env.PATH;

      function verifyCompilationResult({
        stdout,
        stderr,
        code: exitCode,
      }: shelljs.ExecOutputReturnValue) {
        expect(exitCode).toBe(0);
        expect(stderr).toEqual(expect.stringContaining(wuzzleMountingText));

        if (outputDir) expect(shelljs.test('-d', outputDir)).toBe(true);
        if (outputContents) {
          Object.keys(outputContents).forEach(outputPath => {
            expect(shelljs.cat(...glob.sync(outputPath)).stdout).toEqual(
              expect.stringContaining(outputContents[outputPath])
            );
          });
        }
        if (outputMessages) {
          outputMessages.forEach(outputMessage => {
            expect(stdout + stderr).toEqual(expect.stringContaining(outputMessage));
          });
        }
      }

      const describeTest = only ? describe.only : skip ? describe.skip : describe;

      describeTest(`${moduleName} ${versionFlag}`, () => {
        beforeEach(() => {
          process.env.PATH = originalEnvPath;
          shelljs.cd(fixtureDir);
          if (outputDir) shelljs.rm('-fr', outputDir);
          shelljs.rm('-fr', globalDir);
        });

        (skipNormal ? it.skip : it)(`runs ${command}`, () => {
          const result = shelljs.exec(genEndToEndExec({ command, envOverrides }), { silent });
          verifyCompilationResult(result);
        });

        if (testGlobal) {
          it(
            `runs ${command} from globals`,
            () => {
              shelljs.mkdir(globalDir);
              const globalContents = glob.sync(path.join(fixtureDir, '*'), {
                absolute: true,
                dot: true,
                ignore: ['**/node_modules', `**/${globalDirName}`],
              });
              shelljs.cp('-fr', globalContents, globalDir);
              shelljs.cd(globalDir);
              if (testGlobal === 'with-install') {
                shelljs.exec('yarn --prod', { silent });
              }
              process.env.PATH = concatEnvPath(
                path.join(fixtureDir, 'node_modules/.bin'),
                process.env.PATH
              );
              const result = shelljs.exec(genEndToEndExec({ command, envOverrides }), {
                silent,
              });
              expect(result.stdout).toEqual(
                expect.stringMatching(`Command '${commandName}' is resolved from globals:`)
              );
              verifyCompilationResult(result);
            },
            testTimeout
          );
        }

        if (testDryRun) {
          it(
            `runs ${command} in dry-run mode`,
            () => {
              const {
                stdout,
                stderr,
                code: exitCode,
              } = shelljs.exec(genEndToEndExec({ command: `${command} --dry-run`, envOverrides }), {
                silent,
              });

              expect(exitCode).toBe(0);
              expect(stderr).toEqual(expect.stringContaining(wuzzleMountingText));

              if (outputContents) {
                Object.keys(outputContents).forEach(outputPath => {
                  expect(glob.sync(outputPath)).toHaveLength(0);
                });
              }
              if (outputMessages) {
                outputMessages.forEach(outputMessage => {
                  expect(stdout + stderr).toEqual(expect.not.stringContaining(outputMessage));
                });
              }
            },
            testTimeout
          );
        }

        if (testUnregister) {
          it(
            `unregisters ${commandName}`,
            () => {
              expect(
                shelljs.exec(
                  genEndToEndExec({ command: `unregister ${commandName}`, envOverrides }),
                  { silent }
                ).code
              ).toBe(0);

              const { stderr, code: exitCode } = shelljs.exec(
                genEndToEndExec({
                  envOverrides: { ...envOverrides, SKIP_PREFLIGHT_CHECK: 'true' },
                  wrapper: 'yarn',
                  command,
                }),
                { silent }
              );
              expect(exitCode).toBe(0);
              expect(stderr).not.toEqual(expect.stringContaining(wuzzleMountingText));
            },
            testTimeout
          );
        }
      });
    });
  });
}
