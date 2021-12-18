import { bgBlue, bgCyan, blue, cyan } from 'chalk';
import fs from 'fs';
import { forEach, template, times } from 'lodash';
import path from 'path';
import shelljs from 'shelljs';
import { genEndToEndExec, itSection, logImmediately } from '../utils';

export interface TestCase {
  fixtureDir: string;
  bareCommand: string;
  wuzzleCommand: string;
  cleanup?: () => void;
  tmplContent: string;
  tmplTesting: string;
  totalTestFileCounts: Record<string, number>;
  perSubDirTestFileCounts: Record<string, number>;
  perFileLineCounts: Record<string, number>;
  only?: boolean;
  skip?: boolean;
}

export type TestCasesInGroups = Record<string, Record<string, TestCase>>;

export const testTimeout = 180000;
export const srcDirName = 'src';
export const silent = true;

interface ReportItem {
  testName?: string;
  slowDownRatio: number;
}

type OverviewReport = Record<'best' | 'worst', ReportItem>;

export function executeTests(testCasesInGroups: TestCasesInGroups): void {
  describe.each(Object.keys(testCasesInGroups))(`perf measure on 'wuzzle %s'`, moduleName => {
    const fixtureInfo = testCasesInGroups[moduleName];

    Object.keys(fixtureInfo).forEach(versionFlag => {
      const {
        fixtureDir,
        bareCommand,
        wuzzleCommand,
        cleanup,
        tmplContent,
        tmplTesting,
        totalTestFileCounts,
        perSubDirTestFileCounts,
        perFileLineCounts,
        only,
        skip,
      } = fixtureInfo[versionFlag];
      const bareExec = path.join(fixtureDir, 'node_modules/.bin', bareCommand);
      const wuzzleExec = genEndToEndExec({ command: wuzzleCommand });
      const wuzzleCommandName = wuzzleCommand.split(' ')[0];
      const cacheDir = path.join(fixtureDir, 'node_modules/.cache');
      const srcDir = path.join(fixtureDir, srcDirName);
      const tmplContentCompiled = template(tmplContent);
      const tmplTestingCompiled = template(tmplTesting);

      const describeTest = only ? describe.only : skip ? describe.skip : describe;
      describeTest(`${moduleName} ${versionFlag}`, () => {
        const overviewName = ` PERF - 'wuzzle ${moduleName}' - ${versionFlag} `;
        const overviewReport: OverviewReport = {
          best: { slowDownRatio: Infinity },
          worst: { slowDownRatio: -Infinity },
        };

        beforeAll(() => {
          shelljs.cd(fixtureDir);
        });

        beforeEach(() => {
          shelljs.rm('-fr', srcDir);
        });

        afterAll(() => {
          logImmediately(
            bgCyan(overviewName),
            cyan(`overview report:`),
            JSON.stringify(overviewReport)
          );
          logImmediately();
          logImmediately();
        });

        forEach(totalTestFileCounts, (totalTestFileCount, totalTestFileLabel) => {
          forEach(perSubDirTestFileCounts, (perSubDirTestFileCount, perSubDirTestFileLabel) => {
            forEach(perFileLineCounts, (perFileLineCount, perFileLineLabel) => {
              const subDirCount = Math.ceil(totalTestFileCount / perSubDirTestFileCount);
              doTest(
                'measures by ' +
                  `${totalTestFileLabel} ${perSubDirTestFileLabel} ${perFileLineLabel} files`,
                { subDirCount, perSubDirTestFileCount, perFileLineCount }
              );
            });
          });
        });

        function doTest(
          testName: string,
          opts: {
            subDirCount: number;
            perSubDirTestFileCount: number;
            perFileLineCount: number;
          }
        ) {
          it(
            testName,
            () => {
              logImmediately(bgBlue(overviewName), blue(`${testName}:`), 'processing...');
              logImmediately();

              itSection('prepares files for executions', () => {
                times(opts.subDirCount, i => {
                  const subDir = path.join(srcDir, `t${i}`);
                  shelljs.mkdir('-p', subDir);
                  fs.writeFileSync(
                    path.join(subDir, 'index.js'),
                    tmplContentCompiled({ lineCount: opts.perFileLineCount })
                  );
                  times(opts.perSubDirTestFileCount, j => {
                    fs.writeFileSync(
                      path.join(subDir, `${j}.test.js`),
                      tmplTestingCompiled({ lineCount: opts.perFileLineCount })
                    );
                  });
                });
              });

              const bareMsElapsed = itSection('measures bare execution', () => {
                if (wuzzleCommandName !== 'transpile') {
                  shelljs.exec(genEndToEndExec({ command: `unregister ${wuzzleCommandName}` }), {
                    silent,
                  });
                }
                shelljs.rm('-fr', cacheDir);
                cleanup?.();

                const bareTimeStart = Date.now();
                const bareResult = shelljs.exec(bareExec, { silent });
                const bareTimeClose = Date.now();
                expect(bareResult.code).toBe(0);
                return bareTimeClose - bareTimeStart;
              });

              const wuzzleMsElapsed = itSection('measures wuzzle execution', () => {
                shelljs.rm('-fr', cacheDir);
                cleanup?.();

                const wuzzleTimeStart = Date.now();
                const wuzzleResult = shelljs.exec(wuzzleExec, { silent });
                const wuzzleTimeClose = Date.now();
                expect(wuzzleResult.code).toBe(0);
                return wuzzleTimeClose - wuzzleTimeStart;
              });

              // Prints individual report and collects overview report
              const slowDownRatio = wuzzleMsElapsed / bareMsElapsed;
              logImmediately(
                bgBlue(overviewName),
                blue(`${testName}:`),
                JSON.stringify({ bareMsElapsed, wuzzleMsElapsed, slowDownRatio })
              );
              logImmediately();
              logImmediately();
              if (slowDownRatio < overviewReport.best.slowDownRatio) {
                overviewReport.best.testName = testName;
                overviewReport.best.slowDownRatio = slowDownRatio;
              }
              if (slowDownRatio > overviewReport.worst.slowDownRatio) {
                overviewReport.worst.testName = testName;
                overviewReport.worst.slowDownRatio = slowDownRatio;
              }
            },
            testTimeout
          );
        }
      });
    });
  });
}
