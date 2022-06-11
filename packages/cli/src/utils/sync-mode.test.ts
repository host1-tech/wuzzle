import { uniqueId } from 'lodash';

import { SyncMode } from './sync-mode';

describe('SyncMode', () => {
  describe('#constructor', () => {
    it('initializes attributes', () => {
      const iniRet = uniqueId();
      const syncMode = new SyncMode(iniRet);
      expect(syncMode.defaultRet).toBe(iniRet);
      expect(syncMode._ret).toBe(iniRet);
      expect(syncMode._enabled).toBe(false);
    });
  });

  describe('#get ret', () => {
    it('returns ret value', () => {
      const syncMode = new SyncMode('');
      const newRet = uniqueId();
      syncMode._ret = newRet;
      expect(syncMode.ret).toEqual(newRet);
    });
  });

  describe('#get err', () => {
    it('returns err value', () => {
      const syncMode = new SyncMode('');
      const newErr = uniqueId();
      syncMode._err = newErr;
      expect(syncMode.err).toEqual(newErr);
    });
  });

  describe('#get enabled', () => {
    it('returns enabled value', () => {
      const syncMode = new SyncMode('');
      syncMode._enabled = true;
      expect(syncMode.enabled).toBe(true);
      syncMode._enabled = false;
      expect(syncMode.enabled).toBe(false);
    });
  });

  describe('#makeErr', () => {
    it('returns default ret and updates err using input err', () => {
      const iniRet = uniqueId();
      const syncMode = new SyncMode(iniRet);
      const newErr = uniqueId();
      expect(syncMode.makeErr(newErr)).toEqual(iniRet);
      expect(syncMode._err).toEqual(newErr);
    });
  });

  describe('#saveRet', () => {
    it('returns input ret but does not update ret if not enabled', () => {
      const iniRet = uniqueId();
      const syncMode = new SyncMode(iniRet);
      const newRet = uniqueId();
      expect(syncMode.saveRet(newRet)).toBe(newRet);
      expect(syncMode._ret).toBe(iniRet);
    });

    it('returns input ret and updates ret using input ret if enabled', () => {
      const iniRet = uniqueId();
      const syncMode = new SyncMode(iniRet);
      syncMode._enabled = true;
      const newRet = uniqueId();
      expect(syncMode.saveRet(newRet)).toBe(newRet);
      expect(syncMode._ret).toBe(newRet);
    });
  });

  describe('#start', () => {
    it('resets ret, sets err null, sets enabled true', () => {
      const iniRet = uniqueId();
      const syncMode = new SyncMode(iniRet);
      syncMode._ret = uniqueId();
      syncMode._err = uniqueId();
      syncMode._enabled = false;
      syncMode.start();
      expect(syncMode._ret).toEqual(iniRet);
      expect(syncMode._err).toEqual(null);
      expect(syncMode._enabled).toBe(true);
    });
  });

  describe('#close', () => {
    it('sets enabled false', () => {
      const syncMode = new SyncMode('');
      syncMode._enabled = true;
      syncMode.close();
      expect(syncMode._enabled).toBe(false);
    });
  });

  describe('#apply', () => {
    it(
      'resets ret and sets enabled true before execution, ' +
        'affects ret by saveRet during execution,' +
        'sets enabled false after execution',
      () => {
        const iniRet = uniqueId();
        const syncMode = new SyncMode(iniRet);
        const newRet = uniqueId();
        syncMode._ret = uniqueId();
        syncMode._enabled = false;
        const theRet = syncMode.apply(() => {
          expect(syncMode._ret).toEqual(iniRet);
          expect(syncMode._enabled).toBe(true);
          syncMode.saveRet(newRet);
        });
        expect(theRet).toEqual(newRet);
        expect(syncMode._enabled).toBe(false);
      }
    );

    it('throws error if makeErr is called during execution', () => {
      const syncMode = new SyncMode('');
      const newErr = uniqueId();
      expect(() => {
        syncMode.apply(() => syncMode.makeErr(newErr));
      }).toThrow(newErr);
    });
  });
});
