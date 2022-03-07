import type webpackType from 'webpack';

const RuleSet = require('webpack/lib/RuleSet');

export const normalizeRuleSetCondition: (
  condition: webpackType.RuleSetCondition
) => (s: string) => boolean = RuleSet.normalizeCondition;
