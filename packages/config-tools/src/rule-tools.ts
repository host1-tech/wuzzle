import type { MaybeArray } from '@wuzzle/helpers';
import { flatten, isEmpty, omit } from 'lodash';
import path from 'path';
import type webpackType from 'webpack';
import { createRuleSetConditionTest, doesLoaderMatch } from './common-tools';

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
