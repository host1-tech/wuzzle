import type { MaybeArray } from '@wuzzle/helpers';
import { flatten, isEmpty, omit, pick } from 'lodash';
import path from 'path';
import type webpackType from 'webpack';
import { normalizeRuleSetCondition } from './webpack-internal';

// Tools for operating rules

export type RuleOpInput =
  | webpackType.Configuration
  | webpackType.Module
  | webpackType.RuleSetRule[]
  | undefined;

export interface RuleOpQuery {
  file?: MaybeArray<string> | MaybeArray<path.FormatInputPathObject>;
  loader?: MaybeArray<string>;
}

export interface NormalizedRuleOpQuery {
  files?: string[];
  loaders?: string[];
}

export type RuleOpAlter = (rules: webpackType.RuleSetRule[], ruleIdx: number) => void;

export function normalizeRuleOpInput(input: RuleOpInput): webpackType.RuleSetRule[] | undefined {
  if (input === undefined) return input;

  if ('module' in input) {
    return input.module?.rules;
  } else if ('rules' in input) {
    return input.rules;
  } else if (Array.isArray(input)) {
    return input;
  }

  return undefined;
}

export function normalizeRuleOpQuery(query: RuleOpQuery): NormalizedRuleOpQuery {
  return {
    files:
      query.file !== undefined
        ? flatten([query.file]).map(file => (typeof file === 'object' ? path.format(file) : file))
        : query.file,
    loaders: query.loader !== undefined ? flatten([query.loader]) : query.loader,
  };
}

export function doesRuleMatch(
  input?: webpackType.RuleSetRule,
  query?: NormalizedRuleOpQuery
): boolean {
  if (!input || !query) return false;

  const results: boolean[] = [];

  const { files, loaders } = query;

  if (files) {
    const test = createRuleSetConditionTest(input);
    results.push(files.reduce((a, file) => a && test(file), files.length !== 0));
  }

  if (loaders) {
    results.push(
      loaders.reduce((a, loader) => {
        return (
          a &&
          flatten([input.loader, input.loaders, input.use]).reduce<boolean>((a, useItem) => {
            return (
              a ||
              (typeof useItem === 'string' && doesLoaderMatch(useItem, loader)) ||
              (typeof useItem === 'object' && doesLoaderMatch(useItem.loader, loader))
            );
          }, false)
        );
      }, loaders.length !== 0)
    );
  }

  return results.reduce((a, result) => a && result, results.length !== 0);
}

/**
 * Return all matched rules. Will go on recursively if rule fields `rules` `oneOf` are found.
 */
export function findRules(input: RuleOpInput, query: RuleOpQuery): webpackType.RuleSetRule[] {
  const rules = normalizeRuleOpInput(input) ?? [];
  if (rules.length === 0) return [];
  const normalizedQuery = normalizeRuleOpQuery(query);

  const output: webpackType.RuleSetRule[] = [];
  for (const rule of rules) {
    if (doesRuleMatch(rule, normalizedQuery)) {
      output.push(rule);
    }
    output.push(...findRules(rule.oneOf, query));
    output.push(...findRules(rule.rules, query));
  }

  return output;
}

/**
 * Returns the first result of `findRules`.
 */
export function firstRule(
  ...params: Parameters<typeof findRules>
): webpackType.RuleSetRule | undefined {
  return findRules(...params)[0];
}

export function alterRule(input: RuleOpInput, query: RuleOpQuery, alter: RuleOpAlter): boolean {
  const rules = normalizeRuleOpInput(input);
  if (!rules) return false;
  const normalizedQuery = normalizeRuleOpQuery(query);

  let found = false;
  let ruleIdx: number;
  for (ruleIdx = 0; ruleIdx < rules.length; ruleIdx++) {
    const rule = rules[ruleIdx];
    if (doesRuleMatch(rule, normalizedQuery)) {
      found = true;
      break;
    }

    if (alterRule(rule.oneOf, query, alter)) {
      return true;
    }
    if (alterRule(rule.rules, query, alter)) {
      return true;
    }
  }

  if (found) {
    alter(rules, ruleIdx);
  }

  return found;
}

/**
 * Insert new rules before the first recursively matched rule
 */
export function insertBeforeRule(
  input: RuleOpInput,
  query: RuleOpQuery,
  ...newRules: webpackType.RuleSetRule[]
): boolean {
  return alterRule(input, query, (rules, ruleIdx) => rules.splice(ruleIdx, 0, ...newRules));
}

/**
 * Insert new rules after the first recursively matched rule
 */
export function insertAfterRule(
  input: RuleOpInput,
  query: RuleOpQuery,
  ...newRules: webpackType.RuleSetRule[]
): boolean {
  return alterRule(input, query, (rules, ruleIdx) => rules.splice(ruleIdx + 1, 0, ...newRules));
}

/**
 * Replace the first recursively matched rule with new rules
 */
export function replaceRule(
  input: RuleOpInput,
  query: RuleOpQuery,
  ...newRules: webpackType.RuleSetRule[]
): boolean {
  return alterRule(input, query, (rules, ruleIdx) => rules.splice(ruleIdx, 1, ...newRules));
}

/**
 * Delete the first recursively matched rule
 */
export function deleteRule(input: RuleOpInput, query: RuleOpQuery): boolean {
  return alterRule(input, query, (rules, ruleIdx) => rules.splice(ruleIdx, 1));
}

/**
 * Flatten all the rules into single level.
 * Note that rule fields `oneOf` `rules` are still kept.
 */
export function flattenToRules(input: RuleOpInput): webpackType.RuleSetRule[] {
  const rules = normalizeRuleOpInput(input) ?? [];
  if (rules.length === 0) return [];

  const output: webpackType.RuleSetRule[] = [];
  for (const rule of rules) {
    if (!isEmpty(omit(rule, ['oneOf', 'rules']))) {
      output.push(rule);
    }

    output.push(...flattenToRules(rule.oneOf));
    output.push(...flattenToRules(rule.rules));
  }

  return output;
}

// Tools for operating use itmes

export type UseItem = string | webpackType.RuleSetLoader;

export type UseItemOpInput =
  | webpackType.Configuration
  | webpackType.Module
  | webpackType.RuleSetRule[]
  | webpackType.RuleSetRule
  | undefined;

export interface UseItemOpQuery {
  loader?: MaybeArray<string>;
}

export interface NormalizedUseItemOpQuery {
  loaders?: string[];
}

export const RULE_SET_USE_KEYS = ['loader', 'loaders', 'use'] as const;

export type RuleSetUseKey = typeof RULE_SET_USE_KEYS[number];

export type UseItemOpAlter = (
  rule: webpackType.RuleSetRule,
  useKey: RuleSetUseKey,
  useItemIdx: number
) => void;

export function normalizeUseItemOpInput(
  input: UseItemOpInput
): webpackType.RuleSetRule[] | undefined {
  if (input === undefined) return input;

  if ('module' in input) {
    return input.module?.rules;
  } else if ('loader' in input || 'loaders' in input || 'use' in input) {
    return [input];
  } else if ('oneOf' in input) {
    return input.oneOf;
  } else if ('rules' in input) {
    return input.rules;
  } else if (Array.isArray(input)) {
    return input;
  }

  return undefined;
}

export function normalizeUseItemOpQuery(query: UseItemOpQuery): NormalizedUseItemOpQuery {
  return {
    loaders: query.loader !== undefined ? flatten([query.loader]) : query.loader,
  };
}
export function doesUseItemMatch(
  input?: UseItem | Function,
  query?: NormalizedUseItemOpQuery
): input is UseItem {
  if (!input || !query) return false;

  const { loaders } = query;

  if (loaders) {
    return (
      (typeof input === 'string' &&
        loaders.reduce((a, loader) => {
          return a && doesLoaderMatch(input, loader);
        }, loaders.length !== 0)) ||
      (typeof input === 'object' &&
        loaders.reduce((a, loader) => {
          return a && doesLoaderMatch(input.loader, loader);
        }, loaders.length !== 0))
    );
  }

  return false;
}

export function wrapSimpleUseAsArray(rule: webpackType.RuleSetRule, useKey: RuleSetUseKey): void {
  const use = rule[useKey];
  if (Array.isArray(use)) return;

  if (typeof use === 'string' || typeof use === 'object') {
    let useItem: UseItem = use;
    if (typeof use === 'string' && rule.options) {
      useItem = { loader: use, options: rule.options };
      delete rule.options;
    }
    rule[useKey] = [useItem];
  }
}

/**
 * Return all matched use items. Will go on recursively if rule fields `rules` `oneOf` are found.
 */
export function findUseItems(input: UseItemOpInput, query: UseItemOpQuery): UseItem[] {
  const rules = normalizeUseItemOpInput(input) ?? [];
  if (rules.length === 0) return [];
  const normalizedQuery = normalizeUseItemOpQuery(query);

  const output: UseItem[] = [];
  for (const rule of rules) {
    for (const useItem of flatten([rule.loader, rule.loaders, rule.use])) {
      if (doesUseItemMatch(useItem, normalizedQuery)) {
        output.push(useItem);
      }
    }
    output.push(...findUseItems(rule.oneOf, query));
    output.push(...findUseItems(rule.rules, query));
  }

  return output;
}

/**
 * Returns the first result of `findUseItems`.
 */
export function firstUseItem(...params: Parameters<typeof findUseItems>): UseItem | undefined {
  return findUseItems(...params)[0];
}

export function alterUseItem(
  input: UseItemOpInput,
  query: UseItemOpQuery,
  alter: UseItemOpAlter
): boolean {
  const rules = normalizeUseItemOpInput(input);
  if (!rules) return false;
  const normalizedQuery = normalizeUseItemOpQuery(query);

  let found = false;
  let ruleIdx: number;
  let useKey: RuleSetUseKey;
  let useItemIdx: number;
  LoopRule: for (ruleIdx = 0; ruleIdx < rules.length; ruleIdx++) {
    const rule = rules[ruleIdx];
    for (useKey of RULE_SET_USE_KEYS) {
      const useItems = flatten([rule[useKey]]);
      for (useItemIdx = 0; useItemIdx < useItems.length; useItemIdx++) {
        const useItem = useItems[useItemIdx];
        if (doesUseItemMatch(useItem, normalizedQuery)) {
          found = true;
          break LoopRule;
        }
      }
    }

    if (alterUseItem(rule.oneOf, query, alter)) {
      return true;
    }
    if (alterUseItem(rule.rules, query, alter)) {
      return true;
    }
  }

  if (found) {
    alter(rules[ruleIdx], useKey!, useItemIdx!);
  }

  return found;
}

/**
 * Insert new use items before the first recursively matched use item
 */
export function insertBeforeUseItem(
  input: UseItemOpInput,
  query: UseItemOpQuery,
  ...newUseItems: webpackType.RuleSetUseItem[]
): boolean {
  return alterUseItem(input, query, (rule, useKey, useItemIdx) => {
    wrapSimpleUseAsArray(rule, useKey);
    const use = rule[useKey];
    if (Array.isArray(use)) {
      use.splice(useItemIdx, 0, ...newUseItems);
    }
  });
}

/**
 * Insert new use items after the first recursively matched use item
 */
export function insertAfterUseItem(
  input: UseItemOpInput,
  query: UseItemOpQuery,
  ...newUseItems: webpackType.RuleSetUseItem[]
): boolean {
  return alterUseItem(input, query, (rule, useKey, useItemIdx) => {
    wrapSimpleUseAsArray(rule, useKey);
    const use = rule[useKey];
    if (Array.isArray(use)) {
      use.splice(useItemIdx + 1, 0, ...newUseItems);
    }
  });
}

/**
 * Replace the first recursively matched use item with new use item
 */
export function replaceUseItem(
  input: UseItemOpInput,
  query: UseItemOpQuery,
  ...newUseItems: webpackType.RuleSetUseItem[]
): boolean {
  return alterUseItem(input, query, (rule, useKey, useItemIdx) => {
    const use = rule[useKey];
    if (Array.isArray(use)) {
      use.splice(useItemIdx, 1, ...newUseItems);
    } else if (typeof use === 'string' || typeof use === 'object') {
      rule[useKey] = newUseItems;
    }
  });
}

/**
 * Delete the first recursively matched use item
 */
export function deleteUseItem(input: UseItemOpInput, query: UseItemOpQuery): boolean {
  return alterUseItem(input, query, (rule, useKey, useItemIdx) => {
    const use = rule[useKey];
    if (Array.isArray(use)) {
      use.splice(useItemIdx, 1);
    } else if (typeof use === 'string' || typeof use === 'object') {
      delete rule[useKey];
    }
  });
}

/**
 * Flatten all the use items into single level.
 * Note that rule fields `oneOf` `rules` are still kept.
 */
export function flattenToUseItems(input: UseItemOpInput): UseItem[] {
  const rules = normalizeUseItemOpInput(input) ?? [];
  if (rules.length === 0) return [];

  const output: UseItem[] = [];
  for (const rule of rules) {
    for (const useItem of flatten([rule.loader, rule.loaders, rule.use])) {
      if (typeof useItem === 'string' || typeof useItem === 'object') {
        output.push(useItem);
      }
    }
    output.push(...flattenToUseItems(rule.oneOf));
    output.push(...flattenToUseItems(rule.rules));
  }

  return output;
}

// Underlying common tools

export function createRuleSetConditionTest(rule: webpackType.RuleSetRule): (s: string) => boolean {
  try {
    return normalizeRuleSetCondition(
      pick(rule, ['or', 'include', 'test', 'and', 'not', 'exclude'])
    );
  } catch {
    return () => false;
  }
}

export function doesLoaderMatch(input?: string, query?: string): boolean {
  if (!input || !query) return false;
  const inputParts = input.replace(/[\\!?]/g, '/').split('/');
  return query.split('!').reduce<boolean>((a, q) => a && inputParts.includes(q), true);
}
