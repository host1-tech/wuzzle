import { flatten } from 'lodash';
import type webpackType from 'webpack';

import { RULE_SET_USE_KEYS } from './constants';
import {
  alterUseItem,
  deleteUseItem,
  doesUseItemMatch,
  findUseItems,
  firstUseItem,
  flattenToUseItems,
  insertAfterUseItem,
  insertBeforeUseItem,
  NormalizedUseItemOpQuery,
  normalizeUseItemOpInput,
  normalizeUseItemOpQuery,
  replaceUseItem,
  wrapSimpleUseAsArray,
} from './use-item-tools';

describe('normalizeUseItemOpInput', () => {
  it('returns webpackConfig.module.rules', () => {
    expect(normalizeUseItemOpInput({ module: { rules: [] } })).toEqual([]);
  });

  it('wraps single rule input in an array', () => {
    const rule: webpackType.RuleSetRule = { loader: 'a-loader' };
    expect(normalizeUseItemOpInput(rule)).toEqual([rule]);
  });

  it('returns module/rule.rules', () => {
    expect(normalizeUseItemOpInput({ rules: [] })).toEqual([]);
  });

  it('returns rule.oneOf', () => {
    expect(normalizeUseItemOpInput({ oneOf: [] })).toEqual([]);
  });

  it('returns the input itself on rule array input', () => {
    expect(normalizeUseItemOpInput([])).toEqual([]);
  });

  it('returns nil on nil input', () => {
    expect(normalizeUseItemOpInput(undefined)).toBeUndefined();
  });

  it('returns nil on unknown input', () => {
    expect(normalizeUseItemOpInput({})).toBeUndefined();
  });

  it('returns nil if webpackConfig.module.rules is nil', () => {
    expect(normalizeUseItemOpInput({ module: undefined })).toBeUndefined();
  });
});

describe('normalizeUseItemOpQuery', () => {
  describe('loader query', () => {
    it('returns nil on nil input', () => {
      expect(normalizeUseItemOpQuery({}).loaders).toBeUndefined();
    });

    it('formats single string input to string array', () => {
      expect(
        normalizeUseItemOpQuery({
          loader: 'a-loader',
        }).loaders
      ).toEqual(['a-loader']);
    });

    it('formats multiple string inputs to string array', () => {
      expect(
        normalizeUseItemOpQuery({
          loader: ['a-loader', 'b-loader'],
        }).loaders
      ).toEqual(['a-loader', 'b-loader']);
    });
  });
});

describe('doesUseItemMatch', () => {
  it('matches none on any param absence', () => {
    expect(doesUseItemMatch()).toBe(false);
    expect(doesUseItemMatch('a-loader')).toBe(false);
  });

  it('matches by single loader query', () => {
    const query: NormalizedUseItemOpQuery = { loaders: ['a-loader'] };
    expect(doesUseItemMatch('a-loader', query)).toBe(true);
    expect(doesUseItemMatch('b-loader', query)).toBe(false);
  });

  it('matches by multiple loader queries', () => {
    const query: NormalizedUseItemOpQuery = { loaders: ['a-loader', 'b-loader'] };
    expect(doesUseItemMatch('a-loader!b-loader', query)).toBe(true);
    expect(doesUseItemMatch('a-loader', query)).toBe(false);
    expect(doesUseItemMatch('b-loader', query)).toBe(false);
  });

  it('matches none by zero-length loader queries', () => {
    expect(doesUseItemMatch('a-loader', { loaders: [] })).toBe(false);
  });

  it('matches by loader query against object use item', () => {
    expect(doesUseItemMatch({ loader: 'a-loader' }, { loaders: ['a-loader'] })).toBe(true);
  });

  it('matches none by empty query', () => {
    expect(doesUseItemMatch({ loader: 'a-loader' }, {})).toBe(false);
  });
});

describe('wrapSimpleUseAsArray', () => {
  it('does nothing on arrayed use', () => {
    const rule: webpackType.RuleSetRule = { use: ['a-loader'] };
    wrapSimpleUseAsArray(rule, 'use');
    expect(rule).toEqual({ use: ['a-loader'] });
  });

  it('wraps simple string use as array', () => {
    const rule: webpackType.RuleSetRule = { use: 'a-loader' };
    wrapSimpleUseAsArray(rule, 'use');
    expect(rule).toEqual({ use: ['a-loader'] });
  });

  it('wraps simple object use as array', () => {
    const rule: webpackType.RuleSetRule = { use: { loader: 'a-loader' } };
    wrapSimpleUseAsArray(rule, 'use');
    expect(rule).toEqual({ use: [{ loader: 'a-loader' }] });
  });

  it('wraps simple string use as object array on options presented', () => {
    const rule: webpackType.RuleSetRule = { use: 'a-loader', options: {} };
    wrapSimpleUseAsArray(rule, 'use');
    expect(rule).toEqual({ use: [{ loader: 'a-loader', options: {} }] });
  });
});

describe('findUseItems', () => {
  it('matches against plain rules', () => {
    const useItems: webpackType.RuleSetUseItem[] = ['a-loader'];
    expect(findUseItems({ use: useItems }, { loader: 'a-loader' })).toEqual(useItems);
  });

  it('matches against different use item fields', () => {
    RULE_SET_USE_KEYS.forEach(useKey => {
      const useItems: webpackType.RuleSetUseItem[] = ['a-loader'];
      expect(findUseItems({ [useKey]: useItems }, { loader: 'a-loader' })).toEqual(useItems);
    });
  });

  it('matches against simple use', () => {
    const useItem: webpackType.RuleSetUseItem = 'a-loader';
    expect(findUseItems({ use: useItem }, { loader: 'a-loader' })).toEqual([useItem]);
  });

  it(`matches against rule field 'oneOf' recursively`, () => {
    const useItems: webpackType.RuleSetUseItem[] = ['a-loader'];
    expect(
      findUseItems(
        [
          {
            oneOf: [{ use: useItems }],
          },
        ],
        { loader: 'a-loader' }
      )
    ).toEqual(useItems);
  });

  it(`matches against rule field 'rules' recursively`, () => {
    const useItems: webpackType.RuleSetUseItem[] = ['a-loader'];
    expect(
      findUseItems(
        [
          {
            rules: [{ use: useItems }],
          },
        ],
        { loader: 'a-loader' }
      )
    ).toEqual(useItems);
  });
});

describe('firstUseItem', () => {
  it('returns a use item if found', () => {
    const useItem: webpackType.RuleSetUseItem = 'a-loader';
    expect(firstUseItem({ use: useItem }, { loader: 'a-loader' })).toEqual(useItem);
  });

  it('returns nil if not found', () => {
    const useItem: webpackType.RuleSetUseItem = 'a-loader';
    expect(firstUseItem({ use: useItem }, { loader: 'b-loader' })).toBeUndefined();
  });
});

describe('alterUseItem', () => {
  const alter = jest.fn();

  beforeEach(() => {
    alter.mockClear();
  });

  it('operates against plain rules', () => {
    const rule: webpackType.RuleSetRule = { use: ['a-loader'] };
    expect(alterUseItem([rule], { loader: 'a-loader' }, alter)).toBe(true);
    expect(alter).toBeCalledWith(rule, 'use', 0);
  });

  it(`operates against rule field 'oneOf' recursively`, () => {
    const rule: webpackType.RuleSetRule = { use: ['a-loader'] };
    expect(alterUseItem([{ oneOf: [rule] }], { loader: 'a-loader' }, alter)).toBe(true);
    expect(alter).toBeCalledWith(rule, 'use', 0);
  });

  it('operates against simple use', () => {
    const rule: webpackType.RuleSetRule = { use: 'a-loader' };
    expect(alterUseItem([rule], { loader: 'a-loader' }, alter)).toBe(true);
    expect(alter).toBeCalledWith(rule, 'use', 0);
  });

  it(`operates against rule field 'rules' recursively`, () => {
    const rule: webpackType.RuleSetRule = { use: ['a-loader'] };
    expect(alterUseItem([{ rules: [rule] }], { loader: 'a-loader' }, alter)).toBe(true);
    expect(alter).toBeCalledWith(rule, 'use', 0);
  });

  it('operates against different use fields', () => {
    RULE_SET_USE_KEYS.forEach(useKey => {
      const rule: webpackType.RuleSetRule = { [useKey]: ['a-loader'] };
      expect(alterUseItem([rule], { loader: 'a-loader' }, alter)).toBe(true);
      expect(alter).toBeCalledWith(rule, useKey, 0);
    });
  });

  it('operates none if not matched', () => {
    const rule: webpackType.RuleSetRule = { use: ['a-loader'] };
    expect(alterUseItem([rule], { loader: 'b-loader' }, alter)).toBe(false);
    expect(alter).not.toBeCalled();
  });
});

describe('insertBeforeUseItem', () => {
  it('works', () => {
    const newUseItem: webpackType.RuleSetUseItem = 'b-loader';
    const useList: webpackType.RuleSetUse[] = [['a-loader'], 'a-loader', { loader: 'a-loader' }];
    useList.forEach(use => {
      const outUseItem = flatten([newUseItem, use]);
      const rule: webpackType.RuleSetRule = { use };
      expect(insertBeforeUseItem(rule, { loader: 'a-loader' }, newUseItem)).toBe(true);
      expect(rule.use).toEqual(outUseItem);
    });
  });
});

describe('insertAfterUseItem', () => {
  it('works', () => {
    const newUseItem: webpackType.RuleSetUseItem = 'b-loader';
    const useList: webpackType.RuleSetUse[] = [['a-loader'], 'a-loader', { loader: 'a-loader' }];
    useList.forEach(use => {
      const outUseItem = flatten([use, newUseItem]);
      const rule: webpackType.RuleSetRule = { use };
      expect(insertAfterUseItem(rule, { loader: 'a-loader' }, newUseItem)).toBe(true);
      expect(rule.use).toEqual(outUseItem);
    });
  });
});

describe('replaceUseItem', () => {
  it('works', () => {
    const newUseItem: webpackType.RuleSetUseItem = 'b-loader';
    const useList: webpackType.RuleSetUse[] = [['a-loader'], 'a-loader', { loader: 'a-loader' }];
    useList.forEach(use => {
      const outUseItem = [newUseItem];
      const rule: webpackType.RuleSetRule = { use };
      expect(replaceUseItem(rule, { loader: 'a-loader' }, newUseItem)).toBe(true);
      expect(rule.use).toEqual(outUseItem);
    });
  });
});

describe('deleteUseItem', () => {
  it('works', () => {
    const useList: webpackType.RuleSetUse[] = [['a-loader'], 'a-loader', { loader: 'a-loader' }];
    useList.forEach(use => {
      const rule: webpackType.RuleSetRule = { use };
      expect(deleteUseItem(rule, { loader: 'a-loader' })).toBe(true);
      if (rule.use) {
        expect(rule.use).toEqual([]);
      } else {
        expect(rule.use).toBeUndefined();
      }
    });
  });
});

describe('flattenToUseItems', () => {
  it('works', () => {
    const u1: webpackType.RuleSetUseItem = 'a-loader';
    const u2: webpackType.RuleSetUseItem = 'b-loader';
    const u3: webpackType.RuleSetUseItem = 'c-loader';
    const u4: webpackType.RuleSetUseItem = { loader: 'd-loader' };
    const u5: webpackType.RuleSetUseItem = 'e-loader';
    const u6: webpackType.RuleSetUseItem = 'f-loader';
    const input: webpackType.RuleSetRule[] = [
      { loader: u1 },
      { loaders: u2 },
      { use: u3 },
      { use: u4 },
      { oneOf: [{ use: u5 }] },
      { oneOf: [{ use: u6 }] },
    ];
    expect(flattenToUseItems(input)).toEqual([u1, u2, u3, u4, u5, u6]);
  });
});
