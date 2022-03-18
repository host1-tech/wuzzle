import { backupWithRestore, resolveRequire, tryRestoreWithRemove } from '@wuzzle/helpers';
import fs from 'fs';
import { mocked } from 'ts-jest/utils';
import { createRegisterUnregister } from './register-unregister';

const moduleName = 'module-name';
const singleModuleToMatch = 'module-part-0';
const multiModulesToMatch = ['module-part-1', 'module-part-2'];
const commandPath = '/path/to/command';

const contentFrom = (file: fs.PathLike | number) => `content from '${file}'`;
const pathTo = (id: string) => `/path/to/${id}`;

const transform = jest.fn((code: string) => `transformed "${code}"`);

jest.mock('@wuzzle/helpers');
jest.spyOn(fs, 'readFileSync').mockImplementation(contentFrom);
jest.spyOn(fs, 'writeFileSync').mockReturnValue();

describe('createRegisterUnregister', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocked(resolveRequire).mockReset();
  });

  it('works with single module that can be found', () => {
    mocked(resolveRequire).mockImplementation(pathTo);

    const [register, unregister] = createRegisterUnregister({
      moduleName,
      moduleToMatch: singleModuleToMatch,
      transform,
    });

    register({ commandPath });
    expect(backupWithRestore).toBeCalledWith(pathTo(singleModuleToMatch));
    expect(transform).toBeCalledWith(
      contentFrom(pathTo(singleModuleToMatch)),
      pathTo(singleModuleToMatch)
    );

    unregister({ commandPath });
    expect(tryRestoreWithRemove).toBeCalledWith(pathTo(singleModuleToMatch));
  });

  it('works with single module that can not be found', () => {
    mocked(resolveRequire).mockImplementation(() => {
      throw 0;
    });

    const [register, unregister] = createRegisterUnregister({
      moduleName,
      moduleToMatch: singleModuleToMatch,
      transform,
    });

    expect(() => register({ commandPath })).toThrow(commandPath);
    expect(backupWithRestore).not.toBeCalled();
    expect(transform).not.toBeCalled();
    expect(() => unregister({ commandPath })).not.toThrow();
    expect(tryRestoreWithRemove).not.toBeCalled();
  });

  it('works with multi modules that can be all found', () => {
    mocked(resolveRequire).mockImplementation(pathTo);

    const [register, unregister] = createRegisterUnregister({
      moduleName,
      moduleToMatch: multiModulesToMatch,
      transform,
    });

    register({ commandPath });
    multiModulesToMatch.forEach((moduleToMatch, i) => {
      const nth = i + 1;
      expect(backupWithRestore).toHaveBeenNthCalledWith(nth, pathTo(moduleToMatch));
      expect(transform).toHaveBeenNthCalledWith(
        nth,
        contentFrom(pathTo(moduleToMatch)),
        pathTo(moduleToMatch)
      );
    });

    unregister({ commandPath });
    multiModulesToMatch.forEach((moduleToMatch, i) => {
      const nth = i + 1;
      expect(tryRestoreWithRemove).toHaveBeenNthCalledWith(nth, pathTo(moduleToMatch));
    });
  });

  it('works with multi modules that can not be all found', () => {
    const nth = 1;
    const failureIdx = 0;
    const successIdx = 1;
    mocked(resolveRequire).mockImplementation((id: string) => {
      if (id === multiModulesToMatch[failureIdx]) throw 0;
      return pathTo(id);
    });

    const [register, unregister] = createRegisterUnregister({
      moduleName,
      moduleToMatch: multiModulesToMatch,
      transform,
    });

    register({ commandPath });
    expect(backupWithRestore).toHaveBeenNthCalledWith(nth, pathTo(multiModulesToMatch[successIdx]));
    expect(transform).toHaveBeenNthCalledWith(
      nth,
      contentFrom(pathTo(multiModulesToMatch[successIdx])),
      pathTo(multiModulesToMatch[successIdx])
    );

    unregister({ commandPath });
    expect(tryRestoreWithRemove).toHaveBeenNthCalledWith(
      nth,
      pathTo(multiModulesToMatch[successIdx])
    );
  });

  it('works with multi modules that can not be found at all', () => {
    mocked(resolveRequire).mockImplementation(() => {
      throw 0;
    });

    const [register, unregister] = createRegisterUnregister({
      moduleName,
      moduleToMatch: multiModulesToMatch,
      transform,
    });

    expect(() => register({ commandPath })).toThrow(commandPath);
    expect(backupWithRestore).not.toBeCalled();
    expect(transform).not.toBeCalled();
    expect(() => unregister({ commandPath })).not.toThrow();
    expect(tryRestoreWithRemove).not.toBeCalled();
  });
});
