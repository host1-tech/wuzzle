import { pick } from 'lodash';
import type webpackType from 'webpack';

import { normalizeRuleSetCondition } from './webpack-internal';

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
