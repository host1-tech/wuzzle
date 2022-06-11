import path from 'path';
import type webpackType from 'webpack';

import {
  createRuleSetConditionTest,
  deleteUseItem,
  firstRule,
  firstUseItem,
} from '@wuzzle/config-tools';
import { resolveRequire } from '@wuzzle/helpers';

import { WuzzleModifyOptions } from '../../apply-config';

export default (
  webpackConfig: webpackType.Configuration,
  arg1: unknown,
  { projectPath, commandName, commandArgs, commandType }: WuzzleModifyOptions
) => {
  if (commandName !== 'vue-cli-service') return;

  const vueCliServiceSubCommand = commandArgs[0];
  const vueCliServiceDir = path.dirname(
    resolveRequire('@vue/cli-service/package.json', { basedir: projectPath })
  );

  if (vueCliServiceSubCommand === 'test:unit' && commandType === 'jest') {
    const {
      context,
      module,
      plugins,
      resolve,
      resolveLoader,
    }: webpackType.Configuration = require(resolveRequire('./webpack.config.js', {
      basedir: vueCliServiceDir,
    }));

    while (deleteUseItem(module, { loader: 'cache-loader' }));

    const vueRule = firstRule(module, { loader: 'vue-loader' });
    if (typeof vueRule !== 'object') {
      throw new Error('Cannot find vue-loader in webpack config');
    }
    const vueItem = firstUseItem(vueRule, { loader: 'vue-loader' });
    if (typeof vueItem !== 'object') {
      throw new Error('Cannot find vue-loader in webpack config');
    }

    const vueItemOptions = vueItem.options;
    if (typeof vueItemOptions === 'object') {
      ['cacheDirectory', 'cacheIdentifier'].forEach(k => {
        delete vueItemOptions[k];
      });
      Object.assign(vueItemOptions, { optimizeSSR: false, isServerBuild: false });
    }

    if (plugins) {
      const { VueLoaderPlugin } = require(resolveRequire('vue-loader', {
        basedir: vueCliServiceDir,
      }));
      while (true) {
        const toDelete = plugins.findIndex(p => !(p instanceof VueLoaderPlugin));
        if (toDelete < 0) break;
        plugins.splice(toDelete, 1);
      }
    }

    const builtinExternals = webpackConfig.externals;
    if (!Array.isArray(builtinExternals)) {
      throw new Error('Cannot find builtin external in webpack config');
    }
    const builtinExternal = builtinExternals[0];
    if (typeof builtinExternal !== 'function') {
      throw new Error('Cannot find builtin external in webpack config');
    }

    const isVueFile = createRuleSetConditionTest(vueRule);
    const externals: webpackType.ExternalsElement[] = [
      (context, request: string, callback) => {
        const { pathname, searchParams } = new URL(request, 'file:');
        if (isVueFile(pathname) && searchParams.has('type')) {
          callback();
        } else {
          builtinExternal(context, request, callback);
        }
      },
    ];

    Object.assign(webpackConfig, { context, module, plugins, resolve, resolveLoader, externals });
  }
};
