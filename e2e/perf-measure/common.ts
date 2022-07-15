import { bgBlue, bgCyan, blue, cyan } from 'chalk';
import fs from 'fs';
import { forEach, template, times } from 'lodash';
import path from 'path';
import shelljs from 'shelljs';

import { expectExecSuccess, logImmediately } from '../utils';

export interface TestCase {
  fixtureDir: string;
  bareExec: string;
  wuzzleExec: string;
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

export const testTimeout = 3 * 60 * 1000;
export const srcDirName = 'src';
export const subDirPrefix = 't';
export const contentFileName = 'index.js';
export const testingFileSuffix = '.test.js';
export const tmplTopLevelContentCompiled = template(
  `<% _.times(lineCount, i => { %>` +
    `import * as ${subDirPrefix}<%= i %> from './${srcDirName}/${subDirPrefix}<%= i %>';
<% }); %>`
);
export const silent = true;
export const shouldSimplify = !!process.env.CI;

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
        bareExec,
        wuzzleExec,
        cleanup,
        tmplContent,
        tmplTesting,
        totalTestFileCounts,
        perSubDirTestFileCounts,
        perFileLineCounts,
        only,
        skip,
      } = fixtureInfo[versionFlag];
      const cacheDir = path.join(fixtureDir, 'node_modules/.cache');
      const srcDir = path.join(fixtureDir, srcDirName);
      const topLevelContentFile = path.join(fixtureDir, contentFileName);
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
        });

        const breakEarlyFlag = !shouldSimplify;
        forEach(totalTestFileCounts, (totalTestFileCount, totalTestFileLabel) => {
          forEach(perSubDirTestFileCounts, (perSubDirTestFileCount, perSubDirTestFileLabel) => {
            forEach(perFileLineCounts, (perFileLineCount, perFileLineLabel) => {
              const subDirCount = Math.ceil(totalTestFileCount / perSubDirTestFileCount);
              doTest(
                'measures by ' +
                  `${totalTestFileLabel} ${perSubDirTestFileLabel} ${perFileLineLabel} files`,
                { subDirCount, perSubDirTestFileCount, perFileLineCount }
              );
              return breakEarlyFlag;
            });
            return breakEarlyFlag;
          });
          return breakEarlyFlag;
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

              // prepares files for executions
              times(opts.subDirCount, i => {
                const subDir = path.join(srcDir, `${subDirPrefix}${i}`);
                shelljs.mkdir('-p', subDir);
                fs.writeFileSync(
                  path.join(subDir, contentFileName),
                  tmplContentCompiled({ lineCount: opts.perFileLineCount })
                );
                times(opts.perSubDirTestFileCount, j => {
                  fs.writeFileSync(
                    path.join(subDir, `${j}${testingFileSuffix}`),
                    tmplTestingCompiled({ lineCount: opts.perFileLineCount })
                  );
                });
              });
              fs.writeFileSync(
                topLevelContentFile,
                tmplTopLevelContentCompiled({ lineCount: opts.subDirCount })
              );

              // measures bare execution
              shelljs.rm('-fr', cacheDir);
              cleanup?.();
              const bareTimeStart = Date.now();
              const bareResult = shelljs.exec(bareExec, { silent });
              const bareTimeClose = Date.now();
              expectExecSuccess(bareResult.code, bareResult.stderr);
              const bareMsElapsed = bareTimeClose - bareTimeStart;

              // measures wuzzle execution
              shelljs.rm('-fr', cacheDir);
              cleanup?.();
              const wuzzleTimeStart = Date.now();
              const wuzzleResult = shelljs.exec(wuzzleExec, { silent });
              const wuzzleTimeClose = Date.now();
              expectExecSuccess(wuzzleResult.code, wuzzleResult.stderr);
              const wuzzleMsElapsed = wuzzleTimeClose - wuzzleTimeStart;

              // Prints individual report and collects overview report
              const slowDownRatio = wuzzleMsElapsed / bareMsElapsed;
              logImmediately(
                bgBlue(overviewName),
                blue(`${testName}:`),
                JSON.stringify({ bareMsElapsed, wuzzleMsElapsed, slowDownRatio })
              );
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
