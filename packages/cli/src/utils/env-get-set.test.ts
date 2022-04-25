import { clone, uniqueId } from 'lodash';
import { EK } from '../constants';
import {
  envGet,
  envGetDefault,
  envSet,
  optionalObjectEnvGetSet,
  optionalObjectEnvGetSetWithCustomMerge,
  optionalStringEnvGetSet,
  requiredObjectEnvGetSet,
  requiredObjectEnvGetSetWithCustomMerge,
  requiredStringEnvGetSet,
} from './env-get-set';

const originalEnv = process.env;

beforeEach(() => {
  process.env = clone(originalEnv);
});

describe('optionalStringEnvGetSet', () => {
  const ek = uniqueId() as never;
  const { get, set, envDefaultVal } = optionalStringEnvGetSet(ek);

  it('gets', () => {
    expect(get()).toBeUndefined();
    const ev = uniqueId();
    process.env[ek] = ev;
    expect(get()).toEqual(ev);
  });

  it('sets', () => {
    const ev = uniqueId();
    set(ev);
    expect(process.env[ek]).toEqual(ev);
  });

  it('returns default', () => {
    expect(envDefaultVal).toBeUndefined();
  });
});

describe('requiredStringEnvGetSet', () => {
  const ek = uniqueId() as never;
  const edv = uniqueId();
  const { get, envDefaultVal } = requiredStringEnvGetSet(ek, edv);

  it('gets', () => {
    expect(get()).toEqual(edv);
    const ev = uniqueId();
    process.env[ek] = ev;
    expect(get()).toEqual(ev);
  });

  it('returns default', () => {
    expect(envDefaultVal).toEqual(edv);
  });
});

describe('optionalObjectEnvGetSet', () => {
  const ek = uniqueId() as never;
  const { get, set, envDefaultVal } = optionalObjectEnvGetSet(ek);

  it('gets', () => {
    expect(get()).toBeUndefined();
    process.env[ek] = '{';
    expect(get()).toBeUndefined();
    const ev = { id: uniqueId() };
    process.env[ek] = JSON.stringify(ev);
    expect(get()).toEqual(ev);
  });

  it('sets', () => {
    const ev = { id: uniqueId() };
    set(ev);
    expect(process.env[ek]).toEqual(JSON.stringify(ev));
  });

  it('returns default', () => {
    expect(envDefaultVal).toBeUndefined();
  });
});

describe('requiredObjectEnvGetSet', () => {
  const ek = uniqueId() as never;
  const edv = { id: uniqueId() };
  const { get, envDefaultVal } = requiredObjectEnvGetSet(ek, edv);

  it('gets', () => {
    expect(get()).toEqual(edv);
    process.env[ek] = '{';
    expect(get()).toEqual(edv);
    const ev = { id: uniqueId() };
    process.env[ek] = JSON.stringify(ev);
    expect(get()).toEqual(ev);
  });

  it('returns default', () => {
    expect(envDefaultVal).toEqual(edv);
  });
});

describe('optionalObjectEnvGetSetWithCustomMerge', () => {
  const ek = uniqueId() as never;

  it('sets on merge success', () => {
    const { set } = optionalObjectEnvGetSetWithCustomMerge(ek, (a, b) => {
      return Object.assign({}, a, b);
    });
    const ev = { id: uniqueId() };
    process.env[ek] = JSON.stringify({ id: 'id', name: 'name' });
    set(ev);
    expect(process.env[ek]).toEqual(JSON.stringify({ ...ev, name: 'name' }));
  });

  it('sets on merge failure', () => {
    const { set } = optionalObjectEnvGetSetWithCustomMerge(ek, x => {
      throw x;
    });
    const ev = { id: uniqueId() };
    process.env[ek] = JSON.stringify({ id: 'id', name: 'name' });
    set(ev);
    expect(process.env[ek]).toEqual(JSON.stringify(ev));
  });

  it('returns default', () => {
    const { envDefaultVal } = optionalObjectEnvGetSetWithCustomMerge(ek, x => x);
    expect(envDefaultVal).toBeUndefined();
  });
});

describe('requiredObjectEnvGetSetWithCustomMerge', () => {
  const ek = uniqueId() as never;
  const edv = { id: uniqueId() };

  it('sets on merge success', () => {
    const { set } = requiredObjectEnvGetSetWithCustomMerge(ek, edv, (a, b) => {
      return Object.assign({}, a, b);
    });
    const ev = { id: uniqueId() };
    process.env[ek] = JSON.stringify({ id: 'id', name: 'name' });
    set(ev);
    expect(process.env[ek]).toEqual(JSON.stringify({ ...ev, name: 'name' }));
  });

  it('sets on merge failure', () => {
    const { set } = requiredObjectEnvGetSetWithCustomMerge(ek, edv, x => {
      throw x;
    });
    const ev = { id: uniqueId() };
    process.env[ek] = JSON.stringify({ id: 'id', name: 'name' });
    set(ev);
    expect(process.env[ek]).toEqual(JSON.stringify(ev));
  });

  it('returns default', () => {
    const { envDefaultVal } = requiredObjectEnvGetSetWithCustomMerge(ek, edv, x => x);
    expect(envDefaultVal).toEqual(edv);
  });
});

describe(EK.INTERNAL_PRE_CONFIG, () => {
  it('gets default', () => {
    expect(envGetDefault(EK.INTERNAL_PRE_CONFIG)).toBeUndefined();
    expect(envGet(EK.INTERNAL_PRE_CONFIG)).toBeUndefined();
  });

  it('modifies env', () => {
    const ev = uniqueId();
    envSet(EK.INTERNAL_PRE_CONFIG, ev);
    expect(envGet(EK.INTERNAL_PRE_CONFIG)).toEqual(ev);
  });
});

describe(EK.RPOJECT_ANCHOR, () => {
  const edv = 'package.json';

  it('gets default', () => {
    expect(envGetDefault(EK.RPOJECT_ANCHOR)).toEqual(edv);
    expect(envGet(EK.RPOJECT_ANCHOR)).toEqual(edv);
  });

  it('modifies env', () => {
    const ev = uniqueId();
    envSet(EK.RPOJECT_ANCHOR, ev);
    expect(envGet(EK.RPOJECT_ANCHOR)).toEqual(ev);
  });
});

describe(EK.NODE_LIKE_EXTRA_OPTIONS, () => {
  const edv = { verbose: true, exts: ['.js'] };

  it('gets default', () => {
    expect(envGetDefault(EK.NODE_LIKE_EXTRA_OPTIONS)).toEqual(edv);
    expect(envGet(EK.NODE_LIKE_EXTRA_OPTIONS)).toEqual(edv);
  });

  it('modifies env', () => {
    const ev = { verbose: false, exts: ['.ts'] };
    envSet(EK.NODE_LIKE_EXTRA_OPTIONS, ev);
    expect(envGet(EK.NODE_LIKE_EXTRA_OPTIONS)).toEqual({ ...ev, exts: [...edv.exts, ...ev.exts] });
  });
});

describe(EK.JEST_EXTRA_OPTIONS, () => {
  const edv = { webpack: true };

  it('gets default', () => {
    expect(envGetDefault(EK.JEST_EXTRA_OPTIONS)).toEqual(edv);
    expect(envGet(EK.JEST_EXTRA_OPTIONS)).toEqual(edv);
  });

  it('modifies env', () => {
    const ev = { webpack: false };
    envSet(EK.JEST_EXTRA_OPTIONS, ev);
    expect(envGet(EK.JEST_EXTRA_OPTIONS)).toEqual(ev);
  });
});
