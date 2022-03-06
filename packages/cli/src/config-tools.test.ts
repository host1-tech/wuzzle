import { flatten } from 'lodash';
import type webpackType from 'webpack';
import {
  alterRule,
  alterUseItem,
  createRuleSetConditionTest,
  deleteRule,
  deleteUseItem,
  doesLoaderMatch,
  doesRuleMatch,
  doesUseItemMatch,
  findRules,
  findUseItems,
  firstRule,
  firstUseItem,
  flattenToRules,
  flattenToUseItems,
  insertAfterRule,
  insertAfterUseItem,
  insertBeforeRule,
  insertBeforeUseItem,
  NormalizedRuleOpQuery,
  NormalizedUseItemOpQuery,
  normalizeRuleOpInput,
  normalizeRuleOpQuery,
  normalizeUseItemOpInput,
  normalizeUseItemOpQuery,
  replaceRule,
  replaceUseItem,
  RULE_SET_USE_KEYS,
  wrapSimpleUseAsArray,
} from './config-tools';

describe('normalizeRuleOpInput', () => {
  it('returns webpackConfig.module.rules', () => {
    expect(normalizeRuleOpInput({ module: { rules: [] } })).toEqual([]);
  });

  it('returns module.rules', () => {
    expect(normalizeRuleOpInput({ rules: [] })).toEqual([]);
  });

  it('returns the input itself on rule array input', () => {
    expect(normalizeRuleOpInput([])).toEqual([]);
  });

  it('returns nil on nil input', () => {
    expect(normalizeRuleOpInput(undefined)).toBeUndefined();
  });

  it('returns nil on unknown input', () => {
    expect(normalizeRuleOpInput({})).toBeUndefined();
  });

  it('returns nil if webpackConfig.module.rules is nil', () => {
    expect(normalizeRuleOpInput({ module: undefined })).toBeUndefined();
  });
});

describe('normalizeRuleOpQuery', () => {
  describe('file query', () => {
    it('returns nil on nil input', () => {
      expect(normalizeRuleOpQuery({}).files).toBeUndefined();
    });

    it('formats single object input to string array', () => {
      expect(
        normalizeRuleOpQuery({
          file: { dir: '/path/to', base: 'file' },
        }).files
      ).toEqual(['/path/to/file']);
    });

    it('format multiple object inputs to string array', () => {
      expect(
        normalizeRuleOpQuery({
          file: [
            { dir: '/path/to', base: 'file1' },
            { dir: '/path/to', base: 'file2' },
          ],
        }).files
      ).toEqual(['/path/to/file1', '/path/to/file2']);
    });

    it('formats single string input to string array', () => {
      expect(
        normalizeRuleOpQuery({
          file: '/path/to/file',
        }).files
      ).toEqual(['/path/to/file']);
    });

    it('formats multiple string inputs to string array', () => {
      expect(
        normalizeRuleOpQuery({
          file: ['/path/to/file1', '/path/to/file2'],
        }).files
      ).toEqual(['/path/to/file1', '/path/to/file2']);
    });
  });

  describe('loader query', () => {
    it('returns nil on nil input', () => {
      expect(normalizeRuleOpQuery({}).loaders).toBeUndefined();
    });

    it('formats single string input to string array', () => {
      expect(
        normalizeRuleOpQuery({
          loader: 'a-loader',
        }).loaders
      ).toEqual(['a-loader']);
    });

    it('formats multiple string inputs to string array', () => {
      expect(
        normalizeRuleOpQuery({
          loader: ['a-loader', 'b-loader'],
        }).loaders
      ).toEqual(['a-loader', 'b-loader']);
    });
  });
});

describe('doesRuleMatch', () => {
  it('matches none on any param absence', () => {
    expect(doesRuleMatch()).toBe(false);
    expect(doesRuleMatch({ test: /\.x$/, use: ['a-loader'] })).toBe(false);
  });

  it('matches by single file query', () => {
    const query: NormalizedRuleOpQuery = { files: ['index.x'] };
    expect(doesRuleMatch({ test: /\.x$/ }, query)).toBe(true);
    expect(doesRuleMatch({ test: /\.y$/ }, query)).toBe(false);
  });

  it('matches by multiple file queries', () => {
    const query: NormalizedRuleOpQuery = { files: ['index.x', 'index.y'] };
    expect(doesRuleMatch({ test: /\.(x|y)$/ }, query)).toBe(true);
    expect(doesRuleMatch({ test: /\.(x)$/ }, query)).toBe(false);
    expect(doesRuleMatch({ test: /\.(y)$/ }, query)).toBe(false);
  });

  it('matches none by zero-length file queries', () => {
    expect(doesRuleMatch({ test: /\.(x)$/ }, { files: [] })).toBe(false);
  });

  it(`matches by file query against path describing fields besides 'test'`, () => {
    const rule: webpackType.RuleSetRule = {
      include: '/prefix',
      test: /\.x$/,
      exclude: /\.type\.x$/,
    };
    expect(doesRuleMatch(rule, { files: ['/prefix/index.x'] })).toBe(true);
    expect(doesRuleMatch(rule, { files: ['index.x'] })).toBe(false);
    expect(doesRuleMatch(rule, { files: ['/prefix/index.type.x'] })).toBe(false);
  });

  it('matches by single loader query', () => {
    const query: NormalizedRuleOpQuery = { loaders: ['a-loader'] };
    expect(doesRuleMatch({ use: ['a-loader'] }, query)).toBe(true);
    expect(doesRuleMatch({ use: ['b-loader'] }, query)).toBe(false);
  });

  it('matches by multiple loader queries', () => {
    const query: NormalizedRuleOpQuery = { loaders: ['a-loader', 'b-loader'] };
    expect(doesRuleMatch({ use: ['a-loader', 'b-loader'] }, query)).toBe(true);
    expect(doesRuleMatch({ use: ['a-loader'] }, query)).toBe(false);
    expect(doesRuleMatch({ use: ['b-loader'] }, query)).toBe(false);
  });

  it('matches none by zero-length loader queries', () => {
    expect(doesRuleMatch({ use: ['a-loader'] }, { loaders: [] })).toBe(false);
  });

  it('matches by loader query against simple use', () => {
    expect(doesRuleMatch({ use: 'a-loader' }, { loaders: ['a-loader'] })).toBe(true);
  });

  it('matches by loader query against object use item', () => {
    expect(doesRuleMatch({ use: [{ loader: 'a-loader' }] }, { loaders: ['a-loader'] })).toBe(true);
  });

  it('matches by loader query against different use fields', () => {
    RULE_SET_USE_KEYS.forEach(useKey => {
      expect(doesRuleMatch({ [useKey]: ['a-loader'] }, { loaders: ['a-loader'] })).toBe(true);
    });
  });

  it('matches none by empty query', () => {
    expect(doesRuleMatch({ test: /\.x$/, use: ['a-loader'] }, {})).toBe(false);
  });

  it('matches by combination of different queries', () => {
    const query: NormalizedRuleOpQuery = { files: ['index.x'], loaders: ['a-loader'] };
    expect(doesRuleMatch({ test: /\.x$/, use: ['a-loader'] }, query)).toBe(true);
    expect(doesRuleMatch({ test: /\.x$/ }, query)).toBe(false);
    expect(doesRuleMatch({ use: ['a-loader'] }, query)).toBe(false);
  });
});

describe('findRules', () => {
  it('matches against plain rules', () => {
    const rule: webpackType.RuleSetRule = { test: /\.x$/ };
    expect(findRules([rule], { file: 'index.x' })).toEqual([rule]);
  });

  it(`matches against rule field 'oneOf' recursively`, () => {
    const rule: webpackType.RuleSetRule = { test: /\.x$/ };
    expect(findRules([{ oneOf: [rule] }], { file: 'index.x' })).toEqual([rule]);
  });

  it(`matches against rule field 'rules' recursively`, () => {
    const rule: webpackType.RuleSetRule = { test: /\.x$/ };
    expect(findRules([{ rules: [rule] }], { file: 'index.x' })).toEqual([rule]);
  });
});

describe('firstRule', () => {
  it('returns a rule if found', () => {
    const rule: webpackType.RuleSetRule = { test: /\.x$/ };
    expect(firstRule([rule], { file: 'index.x' })).toEqual(rule);
  });

  it('returns nil if not found', () => {
    const rule: webpackType.RuleSetRule = { test: /\.x$/ };
    expect(firstRule([rule], { file: 'index.y' })).toBeUndefined();
  });
});

describe('alterRule', () => {
  const alter = jest.fn();

  beforeEach(() => {
    alter.mockClear();
  });

  it('operates against plain rules', () => {
    const rules: webpackType.RuleSetRule[] = [{ test: /\.x$/ }];
    expect(alterRule(rules, { file: 'index.x' }, alter)).toBe(true);
    expect(alter).toBeCalledWith(rules, 0);
  });

  it(`operates against rule field 'oneOf' recursively`, () => {
    const rules: webpackType.RuleSetRule[] = [{ test: /\.x$/ }];
    expect(alterRule([{ oneOf: rules }], { file: 'index.x' }, alter)).toBe(true);
    expect(alter).toBeCalledWith(rules, 0);
  });

  it(`operates against rule field 'rules' recursively`, () => {
    const rules: webpackType.RuleSetRule[] = [{ test: /\.x$/ }];
    expect(alterRule([{ rules }], { file: 'index.x' }, alter)).toBe(true);
    expect(alter).toBeCalledWith(rules, 0);
  });

  it('operates none if not matched', () => {
    const rules: webpackType.RuleSetRule[] = [{ test: /\.x$/ }];
    expect(alterRule(rules, { file: 'index.y' }, alter)).toBe(false);
    expect(alter).not.toBeCalled();
  });
});

describe('insertBeforeRule', () => {
  it('works', () => {
    const rules: webpackType.RuleSetRule[] = [{ test: /\.x$/ }, { test: /\.y$/ }];
    const newRule: webpackType.RuleSetRule = { test: /\.z$/ };
    expect(insertBeforeRule(rules, { file: 'index.x' }, newRule)).toBe(true);
    expect(rules).toEqual([newRule, { test: /\.x$/ }, { test: /\.y$/ }]);
  });
});

describe('insertAfterRule', () => {
  it('works', () => {
    const rules: webpackType.RuleSetRule[] = [{ test: /\.x$/ }, { test: /\.y$/ }];
    const newRule: webpackType.RuleSetRule = { test: /\.z$/ };
    expect(insertAfterRule(rules, { file: 'index.x' }, newRule)).toBe(true);
    expect(rules).toEqual([{ test: /\.x$/ }, newRule, { test: /\.y$/ }]);
  });
});

describe('replaceRule', () => {
  it('works', () => {
    const rules: webpackType.RuleSetRule[] = [{ test: /\.x$/ }, { test: /\.y$/ }];
    const newRule: webpackType.RuleSetRule = { test: /\.z$/ };
    expect(replaceRule(rules, { file: 'index.x' }, newRule)).toBe(true);
    expect(rules).toEqual([newRule, { test: /\.y$/ }]);
  });
});

describe('deleteRule', () => {
  it('works', () => {
    const rules: webpackType.RuleSetRule[] = [{ test: /\.x$/ }, { test: /\.y$/ }];
    expect(deleteRule(rules, { file: 'index.x' })).toBe(true);
    expect(rules).toEqual([{ test: /\.y$/ }]);
  });
});

describe('flattenToRules', () => {
  it('works', () => {
    const r1: webpackType.RuleSetRule = { test: /\.x$/ };
    const r2: webpackType.RuleSetRule = { test: /\.y$/ };
    const r3: webpackType.RuleSetRule = { test: /\.z$/ };
    const input: webpackType.RuleSetRule[] = [{ ...r1, oneOf: [r2] }, { rules: [r3] }];
    expect(flattenToRules(input)).toEqual([expect.objectContaining(r1), r2, r3]);
  });
});

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
    const query: NormalizedRuleOpQuery = { loaders: ['a-loader', 'b-loader'] };
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

describe('createRuleSetConditionTest', () => {
  it('creates workable tester on valid fields', () => {
    const test = createRuleSetConditionTest({ test: /\.x$/ });
    expect(test('index.x')).toBe(true);
  });

  it('creates fallback tester on bad fields', () => {
    const test = createRuleSetConditionTest({});
    expect(test('index.x')).toBe(false);
  });
});

describe('doesLoaderMatch', () => {
  it('matches none on any param absence', () => {
    expect(doesLoaderMatch()).toBe(false);
    expect(doesLoaderMatch('/path/to/a-loader')).toBe(false);
  });

  it('returns true on loader matched', () => {
    expect(doesLoaderMatch('/path/to/a-loader', 'a-loader')).toBe(true);
  });

  it('returns false on loader partially matched', () => {
    expect(doesLoaderMatch('/path/to/a-loader', 'loader')).toBe(false);
  });

  it('works with win path input', () => {
    expect(doesLoaderMatch('\\path\\to\\a-loader', 'a-loader')).toBe(true);
  });

  it('works with bang mark', () => {
    expect(doesLoaderMatch('a-loader!b-loader', 'a-loader')).toBe(true);
    expect(doesLoaderMatch('a-loader!b-loader', 'a-loader!b-loader')).toBe(true);
    expect(doesLoaderMatch('a-loader!b-loader', 'a-loader!b-loader!c-loader')).toBe(false);
  });

  it('works with question mark', () => {
    expect(doesLoaderMatch('a-loader?foo', 'a-loader')).toBe(true);
  });
});
