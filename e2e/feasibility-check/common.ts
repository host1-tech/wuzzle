import glob from 'glob';
import path from 'path';
import shelljs from 'shelljs';

import { concatEnvPath, expectExecSuccess, genEndToEndExec } from '../utils';

export interface TestCase {
  fixtureDir: string;
  command: string;
  envOverrides?: Record<string, string>;
  outputDir?: string;
  outputContents?: Record<string, string>;
  outputMessages?: string[];
  debugTexts?: string[];
  debugTextsNotExpected?: string[];
  skipNormal?: boolean;
  testGlobal?: boolean | 'with-install';
  testDryRun?: boolean;
  testUnregister?: boolean | Pick<TestCase, 'envOverrides'>;
  only?: boolean;
  skip?: boolean;
}

export type TestCasesInGroups = Record<string, Record<string, TestCase>>;

export const testTimeout = 60 * 1000;
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
        debugTexts,
        debugTextsNotExpected,
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
      const debugTextsOnMounted = [wuzzleMountingText, ...(debugTexts ?? [])];

      const describeTest = only ? describe.only : skip ? describe.skip : describe;

      describeTest(`${moduleName} ${versionFlag}`, () => {
        beforeEach(() => {
          process.env.PATH = originalEnvPath;
          shelljs.cd(fixtureDir);
          if (outputDir) shelljs.rm('-fr', outputDir);
          shelljs.rm('-fr', globalDir);
        });

        (skipNormal ? it.skip : it)(`runs '${command}'`, () => {
          const result = shelljs.exec(genEndToEndExec({ command, envOverrides }), { silent });
          verifyMountedExecResult(result);
        });

        if (testGlobal) {
          it(
            `runs '${command}' from globals`,
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
              verifyMountedExecResult(result);
            },
            testTimeout
          );
        }

        if (testDryRun) {
          it(
            `runs '${command}' in dry-run mode`,
            () => {
              const result = shelljs.exec(
                genEndToEndExec({ command: `${command} --dry-run`, envOverrides }),
                { silent }
              );
              verifyDryRunExecResult(result);
            },
            testTimeout
          );
        }

        if (testUnregister) {
          const unregisterOpts = typeof testUnregister === 'object' ? testUnregister : {};
          const yarnEnvOverrides = {
            ...envOverrides,
            ...unregisterOpts.envOverrides,
          };
          it(
            `unregisters ${commandName}`,
            () => {
              const unregisterResult = shelljs.exec(
                genEndToEndExec({ command: `unregister ${commandName}`, envOverrides }),
                { silent }
              );
              expectExecSuccess(unregisterResult.code, unregisterResult.stderr);
              const unregisteredExecResult = shelljs.exec(
                genEndToEndExec({ envOverrides: yarnEnvOverrides, wrapper: 'yarn', command }),
                { silent }
              );
              verifyUnregisteredExecResult(unregisteredExecResult);
            },
            testTimeout
          );
        }

        function verifyMountedExecResult({
          stdout,
          stderr,
          code: exitCode,
        }: shelljs.ExecOutputReturnValue) {
          expectExecSuccess(exitCode, stderr);
          debugTextsOnMounted.forEach(text => {
            expect(stderr).toEqual(expect.stringContaining(text));
          });
          if (debugTextsNotExpected) {
            debugTextsNotExpected.forEach(text => {
              expect(stdout).toEqual(expect.not.stringContaining(text));
            });
          }
          if (outputDir) expect(shelljs.test('-d', outputDir)).toBe(true);
          if (outputContents) {
            Object.keys(outputContents).forEach(outputPath => {
              expect(shelljs.cat(...glob.sync(outputPath)).stdout).toEqual(
                expect.stringContaining(outputContents[outputPath])
              );
            });
          }
          if (outputMessages) {
            outputMessages.forEach(message => {
              expect(stdout + stderr).toEqual(expect.stringContaining(message));
            });
          }
        }

        function verifyDryRunExecResult({
          stdout,
          stderr,
          code: exitCode,
        }: shelljs.ExecOutputReturnValue) {
          expectExecSuccess(exitCode, stderr);
          debugTextsOnMounted.forEach(text => {
            expect(stdout).toEqual(expect.stringContaining(text));
          });
          if (debugTextsNotExpected) {
            debugTextsNotExpected.forEach(text => {
              expect(stdout).toEqual(expect.not.stringContaining(text));
            });
          }
          if (outputContents) {
            Object.keys(outputContents).forEach(outputPath => {
              expect(glob.sync(outputPath)).toHaveLength(0);
            });
          }
          if (outputMessages) {
            outputMessages.forEach(message => {
              expect(stdout + stderr).toEqual(expect.not.stringContaining(message));
            });
          }
        }

        function verifyUnregisteredExecResult({
          stderr,
          code: exitCode,
        }: shelljs.ExecOutputReturnValue) {
          expectExecSuccess(exitCode, stderr);
          debugTextsOnMounted.forEach(text => {
            expect(stderr).toEqual(expect.not.stringContaining(text));
          });
        }
      });
    });
  });
}
