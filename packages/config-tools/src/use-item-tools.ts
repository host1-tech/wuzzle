import type { MaybeArray } from '@wuzzle/helpers';
import { flatten } from 'lodash';
import type webpackType from 'webpack';
import { doesLoaderMatch } from './common-tools';
import { RULE_SET_USE_KEYS } from './constants';

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
