import type webpackType from 'webpack';
import { RULE_SET_USE_KEYS } from './constants';
import {
  alterRule,
  deleteRule,
  doesRuleMatch,
  findRules,
  firstRule,
  flattenToRules,
  insertAfterRule,
  insertBeforeRule,
  NormalizedRuleOpQuery,
  normalizeRuleOpInput,
  normalizeRuleOpQuery,
  replaceRule,
} from './rule-tools';

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
