import shelljs from 'shelljs';
import path from 'path';

describe('@wuzzle/cli - wuzzle', () => {
  it('prints message', async () => {
    shelljs.cd(path.dirname(__filename));
    const { stdout } = shelljs.exec('ts-node wuzzle.ts');
    expect(stdout).toContain('Hi');
  });
});
