import { resolveRequire } from '@wuzzle/helpers';
import path from 'path';
import { addHook } from 'pirates';
import shelljs from 'shelljs';
import { mocked } from 'ts-jest/utils';
import { EK_COMMAND_ARGS } from '../../constants';
import { register, transform } from './transform';

const matchingPaths = ['node_modules/react-scripts/bin/react-scripts.js'];

const subcommands = ['build', 'test', 'start'];

const registerPaths: Record<string, string> = {
  posix: '/path/to/register',
  win32: 'D:\\path\\to\\register',
};

const nodePaths: Record<string, string> = {
  posix: '/path/to/node',
  win32: 'D:\\path\\to\\node',
};

const originalNodePath = process.argv[0];

const goodCodes: Record<string, string> = {
  ['3.0.0']: shelljs.cat(path.join(__dirname, 'fixtures/react-scripts-bin-react-scripts@3.0.0.txt'))
    .stdout,
  ['3.4.4']: shelljs.cat(path.join(__dirname, 'fixtures/react-scripts-bin-react-scripts@3.4.4.txt'))
    .stdout,
};

jest.mock('@wuzzle/helpers');
jest.mock('pirates');

beforeEach(() => {
  jest.clearAllMocks();
  process.argv[0] = originalNodePath;
  delete process.env[EK_COMMAND_ARGS];
});

describe('register', () => {
  it('matches paths', () => {
    register();
    const matcher = mocked(addHook).mock.calls[0][1]!.matcher!;
    expect(matcher).toBeTruthy();
    matchingPaths.map(p => {
      expect(matcher(path.posix.normalize(p))).toBe(true);
      expect(matcher(path.win32.normalize(p))).toBe(true);
    });
  });
});

describe('transform', () => {
  describe.each(Object.keys(goodCodes))('%s', (codeFlag: string) => {
    describe.each(subcommands)('react-scripts %s', (subcommand: string) => {
      it.each(Object.keys(registerPaths))('works in %s', (platform: string) => {
        const nodePath = (process.argv[0] = nodePaths[platform]);
        process.env[EK_COMMAND_ARGS] = JSON.stringify([subcommand]);
        const code = goodCodes[codeFlag];
        const registerPath = registerPaths[platform];
        mocked(resolveRequire).mockReturnValueOnce(registerPath);
        const transformedCode = transform(code);
        expect(transformedCode).toEqual(
          expect.stringContaining(registerPath.replace(/\\/g, '\\\\'))
        );
        expect(transformedCode).toEqual(expect.stringContaining(nodePath.replace(/\\/g, '\\\\')));
      });
    });
  });
});
