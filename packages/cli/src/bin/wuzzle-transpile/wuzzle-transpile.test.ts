import { resolveRequire } from '@wuzzle/helpers';
import chokidar from 'chokidar';
import glob from 'glob';
import { noop } from 'lodash';
import path from 'path';
import shelljs from 'shelljs';
import { mocked } from 'ts-jest/utils';
import waitForExpect from 'wait-for-expect';
import {
  CHAR_CTRL_D,
  EK_COMMAND_ARGS,
  EK_COMMAND_NAME,
  EK_DRY_RUN,
  EXIT_CODE_ERROR,
  EXIT_CODE_USER_TERMINATION,
} from '../../constants';
import { transpile } from '../../transpile';
import { dryRunModeCommandOptionName, locateProjectAnchor } from '../../utils';

const fixturePath = path.join(__dirname, 'fixtures');
const fixedArgs = [process.argv[0], resolveRequire('./wuzzle-transpile')];
const originalProcessArgv = process.argv;

const projectPath = fixturePath;
const inputDir = 'src';
const outputDir = 'lib';
const printJs = {
  inputPath: path.normalize(`${inputDir}/print.js`),
  outputPath: path.normalize(`${outputDir}/print.js`),
};
const constantsJs = {
  inputPath: path.normalize(`${inputDir}/constants.js`),
  outputPath: path.normalize(`${outputDir}/constants.js`),
};
const utilsParseJs = {
  inputPath: path.normalize(`${inputDir}/utils/parse.js`),
  outputPath: path.normalize(`${outputDir}/utils/parse.js`),
};
const outdatedOutputFile = path.normalize(`${outputDir}/oudated`);

jest.mock('../../transpile');

jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  locateProjectAnchor: jest.fn(),
}));
mocked(locateProjectAnchor).mockReturnValue(projectPath);

jest.spyOn(console, 'log').mockImplementation(noop);
jest.spyOn(console, 'error').mockImplementation(noop);
jest.spyOn(process, 'exit').mockImplementation(() => {
  throw 0;
});
jest.spyOn(glob, 'sync');
jest.spyOn(process.stdin, 'on');

const chokidarEventHandlers: Record<string, (path: string) => void> = {};
const mockedChokidarFSWatherOn = jest.fn();
const mockedChokidarInstance = { on: mockedChokidarFSWatherOn } as never;
jest.spyOn(chokidar, 'watch').mockReturnValue(mockedChokidarInstance);
mockedChokidarFSWatherOn.mockImplementation((event, listener) => {
  chokidarEventHandlers[event] = listener;
  return mockedChokidarInstance;
});

describe('wuzzle-transpile', () => {
  beforeAll(() => {
    shelljs.cd(fixturePath);
  });

  beforeEach(() => {
    shelljs.rm('-fr', outputDir);
    shelljs.mkdir('-p', outputDir);
    shelljs.touch(outdatedOutputFile);
    jest.clearAllMocks();
    delete process.env[EK_DRY_RUN];
    delete process.env[EK_COMMAND_NAME];
    delete process.env[EK_COMMAND_ARGS];
    process.argv = originalProcessArgv;
    Object.keys(chokidarEventHandlers).forEach(k => delete chokidarEventHandlers[k]);
  });

  it(
    'by default, ' +
      'sets envs, cleans output dir, ' +
      'auto resolves paths, runs in development mode, ' +
      'produces no source map, prints compilation logs',
    async () => {
      const inputGlob = `${inputDir}/**/*`;
      const inputPaths = [constantsJs.inputPath, printJs.inputPath, utilsParseJs.inputPath];
      process.argv = [...fixedArgs, inputGlob, '-d', outputDir];
      jest.isolateModules(() => require('./wuzzle-transpile'));
      expect(locateProjectAnchor).toBeCalled();
      expect(process.env[EK_COMMAND_NAME]).toBe('transpile');
      expect(process.env[EK_COMMAND_ARGS]).toBe(JSON.stringify(process.argv.slice(2)));
      expect(shelljs.test('-f', outdatedOutputFile)).toBe(false);
      await waitForExpect(() => expect(transpile).toBeCalledTimes(inputPaths.length));
      [constantsJs, printJs, utilsParseJs].forEach(({ inputPath, outputPath }, i) => {
        expect(mocked(transpile).mock.calls[i][0]).toMatchObject({
          inputPath: path.resolve(inputPath),
          outputPath: path.resolve(outputPath),
          webpackConfig: { mode: 'development', devtool: undefined },
        });
        expect(includesLog(console.log, `File '${inputPath}' compiled.`)).toBe(true);
      });
    }
  );

  it(`with '-p', runs in production mode`, async () => {
    process.argv = [...fixedArgs, printJs.inputPath, '-d', outputDir, '-p'];
    jest.isolateModules(() => require('./wuzzle-transpile'));
    await waitForExpect(() => {
      expect(mocked(transpile).mock.calls[0][0]).toMatchObject({
        webpackConfig: { mode: 'production' },
      });
    });
  });

  [
    ['cheap-module-source-map', '-s'],
    ['cheap-module-source-map', '-s', 'file'],
    ['inline-cheap-module-source-map', '-s', 'inline'],
    ['source-map', '-s', '-p'],
    ['source-map', '-s', 'file', '-p'],
    ['inline-source-map', '-s', 'inline', '-p'],
  ].forEach(([devtool, ...args]) => {
    it(`with '${args.join(' ')}', produces ${devtool}`, async () => {
      process.argv = [...fixedArgs, printJs.inputPath, '-d', outputDir, ...args];
      jest.isolateModules(() => require('./wuzzle-transpile'));
      await waitForExpect(() => {
        expect(mocked(transpile).mock.calls[0][0]).toMatchObject({
          webpackConfig: { devtool },
        });
      });
    });
  });

  it(`with '--no-clean', should not clean output dir`, async () => {
    process.argv = [...fixedArgs, printJs.inputPath, '-d', outputDir, '--no-clean'];
    jest.isolateModules(() => require('./wuzzle-transpile'));
    await waitForExpect(() => expect(transpile).toBeCalled());
    expect(shelljs.test('-f', outdatedOutputFile)).toBe(true);
  });

  it(`with '-V', prints verbose logs`, async () => {
    process.argv = [...fixedArgs, printJs.inputPath, '-d', outputDir, '-V'];
    jest.isolateModules(() => require('./wuzzle-transpile'));
    await waitForExpect(() => expect(transpile).toBeCalled());
    expect(includesLog(console.log, `Directory '${outputDir}' cleaned.`)).toBe(true);
  });

  it(`with '-w', compiles all first, watches files changes`, async () => {
    process.argv = [...fixedArgs, printJs.inputPath, '-d', outputDir, '-w'];
    mocked(process.stdin.on).mockImplementationOnce(noop as never);
    jest.isolateModules(() => require('./wuzzle-transpile'));
    await waitForExpect(() => expect(transpile).toBeCalled());
    await waitForExpect(() => expect(chokidar.watch).toBeCalled());

    for (const event of ['add', 'change']) {
      mocked(transpile).mockClear();
      chokidarEventHandlers[event](printJs.inputPath);
      await waitForExpect(() => expect(transpile).toBeCalled());
      expect(includesLog(console.log, `File '${printJs.inputPath}' recompiled.`)).toBe(true);
    }

    shelljs.mkdir('-p', outputDir);
    shelljs.touch(printJs.outputPath);
    chokidarEventHandlers['unlink'](printJs.outputPath);
    await waitForExpect(() => expect(shelljs.test('-f', printJs.outputPath)).toBe(false));
  });

  it(`with '--ignore globs', overrides ignored globs`, async () => {
    const ignoredGlobs = ['**/node_modules/**', '**/bower_components/**'];
    process.argv = [
      ...fixedArgs,
      printJs.inputPath,
      '-d',
      outputDir,
      '-w',
      '--ignore',
      ...ignoredGlobs,
    ];
    mocked(process.stdin.on).mockImplementationOnce(noop as never);
    jest.isolateModules(() => require('./wuzzle-transpile'));
    await waitForExpect(() => expect(chokidar.watch).toBeCalled());
    expect(mocked(glob.sync).mock.calls[0][1]).toMatchObject({ ignore: ignoredGlobs });
    expect(mocked(chokidar.watch).mock.calls[0][1]).toMatchObject({ ignored: ignoredGlobs });
  });

  it(
    `with '${dryRunModeCommandOptionName}', ` +
      `sets up dry-run mode, ` +
      `calls tranpsile to print config info`,
    async () => {
      process.argv = [
        ...fixedArgs,
        `${inputDir}/**/*`,
        '-d',
        outputDir,
        dryRunModeCommandOptionName,
      ];
      jest.isolateModules(() => require('./wuzzle-transpile'));
      expect(process.argv).not.toContain(dryRunModeCommandOptionName);
      expect(process.env[EK_DRY_RUN]).toBeTruthy();
      await waitForExpect(() => expect(transpile).toBeCalledTimes(1));
      let error: any;
      try {
        await waitForExpect(() => expect(transpile).toBeCalledTimes(2), 1000);
      } catch (e) {
        error = e;
      }
      expect(error).toBeTruthy();
    }
  );

  it('reports warning if no input path found', async () => {
    const inexistentPath = 'src/inexistent.js';
    process.argv = [...fixedArgs, inexistentPath, '-d', outputDir];
    jest.isolateModules(() => require('./wuzzle-transpile'));
    expect(includesLog(console.log, 'No input file found.')).toBe(true);
    expect(transpile).not.toBeCalled();
  });

  it('reports error on compilation failure', async () => {
    mocked(transpile).mockImplementationOnce(() => {
      throw 0;
    });
    process.argv = [...fixedArgs, printJs.inputPath, '-d', outputDir];
    try {
      jest.isolateModules(() => require('./wuzzle-transpile'));
    } catch {}
    await waitForExpect(() => expect(transpile).toBeCalled());
    expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR);
    expect(includesLog(console.log, `File '${printJs.inputPath}' compilation failed.`)).toBe(true);
  });

  it('reports error stack info if available on failure', async () => {
    const errorMessage = '31a09224f4637755df5b7188342e16df1a90091b';
    mocked(process.exit).mockImplementation(() => {
      throw new Error(errorMessage);
    });
    mocked(transpile).mockImplementationOnce(() => {
      throw 0;
    });
    process.argv = [...fixedArgs, printJs.inputPath, '-d', outputDir];
    try {
      jest.isolateModules(() => require('./wuzzle-transpile'));
    } catch {}
    await waitForExpect(() => expect(includesLog(console.error, errorMessage)).toBe(true));
  });

  it('validates input globs and reports error if not given', async () => {
    process.argv = [...fixedArgs, '-d', outputDir];
    try {
      jest.isolateModules(() => require('./wuzzle-transpile'));
    } catch {}
    await waitForExpect(() => expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR));
    expect(transpile).not.toBeCalled();
    expect(includesLog(console.error, 'error: input globs not specified.')).toBe(true);
  });

  it('validates --target and reports error if not matched', async () => {
    const target = 'unknown';
    process.argv = [...fixedArgs, printJs.inputPath, '-d', outputDir, '-t', target];
    try {
      jest.isolateModules(() => require('./wuzzle-transpile'));
    } catch {}
    await waitForExpect(() => expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR));
    expect(transpile).not.toBeCalled();
    expect(
      includesLog(console.error, `error: option '-t, --target ${target}' not supported.`)
    ).toBe(true);
  });

  it('validates --source-map and reports error if not matched', async () => {
    const sourceMap = 'unknown';
    process.argv = [...fixedArgs, printJs.inputPath, '-d', outputDir, '-s', sourceMap];
    try {
      jest.isolateModules(() => require('./wuzzle-transpile'));
    } catch {}
    await waitForExpect(() => expect(process.exit).toBeCalledWith(EXIT_CODE_ERROR));

    expect(
      includesLog(console.error, `error: option '-s, --source-map ${sourceMap}' not supported.`)
    ).toBe(true);
    expect(transpile).not.toBeCalled();
  });

  it('handles Ctrl-D as exit signal', async () => {
    process.argv = [...fixedArgs, printJs.inputPath, '-d', outputDir, '-w'];
    let processStdinOnDataHandler: (chunk: Buffer) => void = noop;
    mocked(process.stdin.on).mockImplementationOnce(((
      event: string,
      listener: typeof processStdinOnDataHandler
    ) => {
      if (event === 'data') {
        processStdinOnDataHandler = listener;
      }
    }) as never);
    jest.isolateModules(() => require('./wuzzle-transpile'));
    await waitForExpect(() => expect(process.stdin.on).toBeCalled());

    try {
      processStdinOnDataHandler(Buffer.from(' '));
    } catch {}
    expect(process.exit).not.toBeCalled();

    try {
      processStdinOnDataHandler(Buffer.from(CHAR_CTRL_D));
    } catch {}
    expect(process.exit).toBeCalledWith(EXIT_CODE_USER_TERMINATION);
  });
});

function includesLog(LogFunc: typeof console.log | typeof console.error, logStr: string): boolean {
  return mocked(LogFunc).mock.calls.some(params => params.some(p => String(p).includes(logStr)));
}
