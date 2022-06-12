<img alt="Wuzzle Logo" src="https://user-images.githubusercontent.com/8203034/173220696-ac64ac04-9f99-4956-9ba2-2a45f05d11dd.png" width="320" />

<br />

[![](https://img.shields.io/npm/v/wuzzle.svg)](https://www.npmjs.com/package/wuzzle)
[![](https://img.shields.io/codecov/c/github/host1-tech/wuzzle/master.svg)](https://app.codecov.io/gh/host1-tech/wuzzle)
[![](https://img.shields.io/github/license/host1-tech/wuzzle)](https://github.com/host1-tech/wuzzle/blob/master/LICENSE)

> Provides a unified but opt-in way to config all kinds of webpack based compilation easily 🚀

## Why

1. For compilers with webpack embedded for compilation (like [create-react-app](https://github.com/facebook/create-react-app), [vue-cli](https://github.com/vuejs/vue-cli), [next](https://github.com/vercel/next.js), [nuxt](https://github.com/nuxt/nuxt.js), etc), wuzzle provides the ability of modifying their internally used webpack configs.
2. For JS runners with their own methods of compilation (like [jest](https://github.com/facebook/jest), [mocha](https://github.com/mochajs/mocha), the bare [node](https://github.com/nodejs/node), etc), wuzzle can hook up compatible webpack based compilation as replacements.
3. For file transpilation, wuzzle provides a webpack based transpiler.
4. For setup process, wuzzle opts in easily.
5. For modification on webpack configs, wuzzle provides a unified entry, a dry-run mode, and well-tested modification utilities.

## Install

```sh
npm install --save-dev wuzzle
```

## Usage

### Modify internally used webpack configs in compilers

Many compilers embed webpack to do their own compilation. Some of them have their own ideas about compilation customization, like ["eject"](https://create-react-app.dev/docs/available-scripts#npm-run-eject) of `create-react-app` or ["chaining"](https://cli.vuejs.org/guide/webpack.html#chaining-advanced) of `vue-cli`, which might have bothered you. But now, with wuzzle, you can bypass those contraints and modify the internally used webpack configs directly. Take an example of a project created with `create-react-app`.

First, prepend command `wuzzle` to commands `react-scripts start`, `react-scripts build` in the `package.json`:

```diff
  "scripts": {
-    "start": "react-scripts start",
+    "start": "wuzzle react-scripts start",
-    "build": "react-scripts build"
+    "build": "wuzzle react-scripts build"
  }
```

Then, next to the `package.json`, create a file named `wuzzle.config.js` exporting a single top-level function, in which you can modify the webpack config used inside `react-scripts`:

```js
module.exports = (webpackConfig, webpack, wuzzleContext) => {
  // TODO modify the internally used webpack config of the webpack embedded compiler
};
```

The param `wuzzleContext` gives the context about the running command so to help with finer control of your modification. For details of fields, see also interface `WuzzleModifyOptions` in ["src/apply-config"](https://github.com/host1-tech/wuzzle/blob/master/packages/cli/src/apply-config.ts).

Officially, following compilers are guaranteed to work with wuzzle:

- [webpack](https://github.com/webpack/webpack): `>=4`
- [create-react-app](https://github.com/facebook/create-react-app): `>=3`
- [vue-cli](https://github.com/vuejs/vue-cli): `>=4`
- [next](https://github.com/vercel/next.js): `>=9`
- [nuxt](https://github.com/nuxt/nuxt.js): `>=2`
- [taro](https://github.com/NervJS/taro): `>=2`
- [uni-app](https://github.com/dcloudio/uni-app): `>=2`
- [storybook](https://github.com/storybookjs/storybook): `>=6`
- [cypress](https://github.com/cypress-io/cypress): `>=9` (with plugin `@cypress/webpack-preprocessor`)
- [razzle](https://github.com/jaredpalmer/razzle): `>=3`
- [electron-webpack](https://github.com/electron-userland/electron-webpack): `>=2`

But theoretically, any compilers with webpack embedded for compilation would work with wuzzle. Just prepend command `wuzzle` to a compiler's command for a try, like `wuzzle vue-cli-service build` or `wuzzle start-storybook`.

### Hook up webpack based compilation for JS runners

By JS runners, we mean programs that can execute JS files, like test runners or the bare `node`. They usually have their own methods of compilation, like ["transform"](https://archive.jestjs.io/docs/en/24.x/configuration#transform-objectstring-pathtotransformer--pathtotransformer-object) of `jest` or ["require.extensions"](https://nodejs.org/docs/latest-v12.x/api/modules.html#modules_require_extensions) of the bare `node`. They don't follow a consistent form. But, with wuzzle, you can hook up webpack based compilation to make it consistent.

The usage is similarly easy. First, prepend command `wuzzle` to the JS runner's command to hook up webpack based compilation, like `wuzzle jest`. By default, wuzzle replaces the original compilation with a compatible webpack based compilation. Then again, you can utilize the `wuzzle.config.js` next to the `package.json` to adjust the webpack config.

Currently, following JS runners are guaranteed to work with wuzzle:

- [jest](https://github.com/facebook/jest): `>=24`
- [mocha](https://github.com/mochajs/mocha): `>=7`
- the bare [node](https://github.com/nodejs/node): `>=12`
- [create-react-app](https://github.com/facebook/create-react-app): `>=3` (subcommand `test`)
- [vue-cli](https://github.com/vuejs/vue-cli): `>=4` (subcommand `test:unit` with plugin `@vue/cli-plugin-unit-jest`)

And, there are some tips worth mentioning, please read as needed:

<details>
<summary>Special file extentions for node-like JS runners.</summary>

By node-like JS runners, we mean JS runners that have the same method of compilation as the bare `node`, like `mocha`, including the bare `node` itself. By default, they can only execute `.js` files. We provide command option `-E,--ext` to specify the other wanted file extensions to get executed. Please take a try like `wuzzle node -E ".js,.jsx,.ts,.tsx" server.ts`. By the way, if you are doing file requiring with file extentions omitted, like `require('./utils')` towards a TS file `utils.ts`, please make sure the field `resolve.extensions` of the webpack config is properly set.

</details>

<details>
<summary>Performance issue.</summary>

As logics inside the webpack based compilation only run asyncly, but JS runners only accept sync file content compilation, wuzzle has to utilize some hacky trick internally to make the former async fit the latter sync. As a result, some performance loss is introduced when webpack based compilaton is hooked up for JS runners. For the remediation, we provide command option `--pre-compile` which can get the specified files compiled all beforehand in bulk so to minimize the performance loss. Please take a try like `wuzzle jest --pre-compile "src/\*_/_.ts?(x)"`.

</details>

<details>
<summary>Further customize a JS runner's own method of compilation.</summary>

On the other hand, in case that you might only want to further customize a JS runner's own method of compilation, wuzzle provides a fallback ability. By far, it's only available for jest-like JS runners. By jest-like JS runners, we mean JS runners that are built on `jest`, like subcommand `test` of `create-react-app` or subcommand `test:unit` of `vue-cli` with plugin `@vue/cli-plugin-unit-jest`, including `jest` itself. The usage is straightforward, too.

First, add command option `--no-webpack` while prepending command `wuzzle` to the jest-like JS runner's command, like `wuzzle react-scripts test --no-webpack`. Then, with the `wuzzle.config.js`, instead of a single top-level function, export an object with a funtion field named `jest` to adjust the jest config:

```js
module.exports = {
  jest(jestConfig, jestInfo, wuzzleContext) {
    // TODO modify the internally used jest config of the jest-like JS runner
  },
};
```

Notice that, the first param `jestConfig` is not the same externally used [jest config](https://archive.jestjs.io/docs/en/24.x/configuration). It's the internally used jest config and please refer to ["ProjectConfig"](https://github.com/facebook/jest/blob/v24.9.0/packages/jest-types/src/Config.ts#L367-L421) for its data structure.

</details>

For details about extended usages that wuzzle provides for JS runners, see also command option `-H,--Help`, like `wuzzle jest -H`.

### Webpack based file transpilation

With webpack, a regular practice is to generate JS bundles, and file transpilation can be too tedious to do. Though in JS bundles, dynamically accessing source files at runtime can be pretty tricky because the original directory structure gets lost while bundling. Now, to make most of webpack, wuzzle introduces webpack based transpilation with command `wuzzle transpile`:

```sh
$ wuzzle transpile --help

Usage: wuzzle-transpile [options] <globs...>

Options:
  -d, --out-dir <dir>         Compile input files into output directory.
  -w, --watch                 Recompile files on changes.
  --ignore <string>           List of globs not to compile, split by ",". (default: "**/node_modules/**,<absoluteOutDir>/**,**/*.d.ts?(x)")
  -b, --base-path <path>      Resolve input files relative to base path for output subpaths in output directory. (default: longest common path of input files)
  -c, --concurrency <number>  Prevent compiling more than specific amount of files at the same time. (default: os.cpus().length)
  -p, --production            Tell webpack to use production optimization
  -t, --target <string>       Set wepback deployment target. One of "async-node", "electron-main", "electron-renderer", "electron-preload", "node", "node-webkit", "web", or "webworker". (default: "node")
  -s, --source-map [string]   Generate source map. One of "none", "file", or "inline". (default: "none", or "file" if specified without value)
  --no-clean                  Prevent cleaning out directory.
  -F, --follow                Follow symlinked directories when expanding "**" patterns.
  -V, --verbose               Show more details.
  -v, --version               Output the version number.
  -h, --help                  Output usage information.
```

A typical usage may look like `wuzzle transpile "src/**/*" -s -d dist`, meanwhile, additionally with command option `-p` for optimization or `-w` for watch mode. Again, you can utilize the `wuzzle.config.js` next to the `package.json` to modify the internally used webpack config.

### Dry-run mode

To view the webpack config modification in the `wuzzle.config.js` more clearly, here is the dry-run mode, which you can activate by command option `--dry-run`, like `wuzzle react-scripts build --dry-run`. The dry-run mode will audit the modification in the `wuzzle.config.js`, and print the webpack config with diffs, but skip executing the actual execution of the command. It's available along with all the usages of wuzzle above.

### Modification utilities on webpack configs

As modifying webpack configs can be quite tedious and sometimes tricky, wuzzle provides you well-tested modification utilities, which can be imported directly from package `wuzzle` in the `wuzzle.config.js`, like `const { insertBeforeRule } = require('wuzzle');`. Every modification utility follows a pattern of "`query` from the `input`, then do", which also drives the first 2 params to always be `input` and `query`. The full list of those utilities is as below:

```ts
import type pathType from 'path';
import type webpackType from 'webpack';

type RuleOpInput =
  | webpackType.Configuration
  | webpackType.Module
  | webpackType.RuleSetRule[]
  | undefined;

interface RuleOpQuery {
  file?: string | string[] | pathType.FormatInputPathObject | pathType.FormatInputPathObject[];
  loader?: string | string[];
}

type UseItem = string | webpackType.RuleSetLoader;

type UseItemOpInput =
  | webpackType.Configuration
  | webpackType.Module
  | webpackType.RuleSetRule[]
  | webpackType.RuleSetRule
  | undefined;

interface UseItemOpQuery {
  loader?: string | string[];
}

/**
 * Return all matched rules. Will go on recursively if rule fields `rules` `oneOf` are found.
 */
function findRules(input: RuleOpInput, query: RuleOpQuery): webpackType.RuleSetRule[];

/**
 * Return all matched use items. Will go on recursively if rule fields `rules` `oneOf` are found.
 */
function findUseItems(input: UseItemOpInput, query: UseItemOpQuery): UseItem[];

/**
 * Returns the first result of `findRules`.
 */
function firstRule(input: RuleOpInput, query: RuleOpQuery): webpackType.RuleSetRule | undefined;

/**
 * Returns the first result of `findUseItems`.
 */
function firstUseItem(input: UseItemOpInput, query: UseItemOpQuery): UseItem | undefined;

/**
 * Insert new rules before the first recursively matched rule
 */
function insertBeforeRule(
  input: RuleOpInput,
  query: RuleOpQuery,
  ...newRules: webpackType.RuleSetRule[]
): boolean;

/**
 * Insert new use items before the first recursively matched use item
 */
function insertBeforeUseItem(
  input: UseItemOpInput,
  query: UseItemOpQuery,
  ...newUseItems: webpackType.RuleSetUseItem[]
): boolean;

/**
 * Insert new rules after the first recursively matched rule
 */
function insertAfterRule(
  input: RuleOpInput,
  query: RuleOpQuery,
  ...newRules: webpackType.RuleSetRule[]
): boolean;

/**
 * Insert new use items after the first recursively matched use item
 */
function insertAfterUseItem(
  input: UseItemOpInput,
  query: UseItemOpQuery,
  ...newUseItems: webpackType.RuleSetUseItem[]
): boolean;

/**
 * Replace the first recursively matched rule with new rules
 */
function replaceRule(
  input: RuleOpInput,
  query: RuleOpQuery,
  ...newRules: webpackType.RuleSetRule[]
): boolean;

/**
 * Replace the first recursively matched use item with new use item
 */
function replaceUseItem(
  input: UseItemOpInput,
  query: UseItemOpQuery,
  ...newUseItems: webpackType.RuleSetUseItem[]
): boolean;

/**
 * Delete the first recursively matched rule
 */
function deleteRule(input: RuleOpInput, query: RuleOpQuery): boolean;

/**
 * Delete the first recursively matched use item
 */
function deleteUseItem(input: UseItemOpInput, query: UseItemOpQuery): boolean;
```

The keywords [rule](https://v4.webpack.js.org/configuration/module/#modulerules) and [use item](https://v4.webpack.js.org/configuration/module/#ruleuse) are webpack concepts. The former defines the primary part of the compilation and the latter defines the concretes of the former. The `query` fields, `file` and `loader`, decide how to find the target. The former is to query a rule that matches the give file path and the latter is to query a rule or a use item that contains a loader matching the given loader name. Notice that, values of different query fields are applied in the behavior of logical OR but values of a same query field are applied in the bahavior of logical AND. For example, a `query` value of `{ file: 'index.ts', loader: ['a-loader', 'b-loader'] }` is to query a rule that matches file path `index.ts` OR contains loaders matching loader names `a-loader` AND `b-loader`.

## Realworld Examples

If you are interested in how wuzzle works in the real world, we have a realworld app built on the React app created with `create-react-app`, which contains scripts of build, watch, unit test, end-to-end test, lint and launch. The app is preapred for the purpose of e2e testing and it's able to serve as a realworld example, too. Please take a look at ["e2e/.../react-scripts"](https://github.com/host1-tech/wuzzle/tree/master/e2e/realworld-use/fixtures/react-scripts) if needed.

## Contributing

If you met any problems, just reach out to us with the [issue tracker](https://github.com/host1-tech/wuzzle/issues). It's either good in English or Chinese. If you'd like to take part in the development yourself, please see also [CONTRIBUTING.md](https://github.com/host1-tech/wuzzle/blob/master/CONTRIBUTING.md). Welcome any contributors!
