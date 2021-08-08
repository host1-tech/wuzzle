<p align="center">
  <img alt="Wuzzle" src="https://user-images.githubusercontent.com/8203034/108078190-56eb2600-70a8-11eb-925a-112064dd71ff.jpg" width="320">
</p>

<h3 align="center">
  Config all kinds of webpack compilations in a painless way! 💊
</h3>

<br>

[![](https://img.shields.io/npm/v/wuzzle.svg)](https://www.npmjs.com/package/wuzzle)
[![](https://img.shields.io/codecov/c/github/host1-tech/wuzzle/master.svg)](https://app.codecov.io/gh/host1-tech/wuzzle)
[![](https://img.shields.io/github/license/host1-tech/wuzzle)](https://github.com/host1-tech/wuzzle/blob/master/LICENSE)

## Install

Install with npm:

```sh
npm install --save-dev wuzzle
```

Install with yarn:

```sh
yarn add --dev wuzzle
```

## Introduction

Wuzzle intends to provide a painless way to config all kinds of webpack compliations by:

- Hijacking and altering webpack configs inside webpack embedded bundlers.
- Transpiling files with webpack compilations.
- Registering webpack compilations on files requiring.

## Usage

### Hijacking and Altering

A bundler, as long as it has webpack embedded inside, is hijackable by wuzzle. Take [CRA](https://github.com/facebook/create-react-app) for example:

```diff
  "scripts": {
-    "start": "react-scripts start",
+    "start": "wuzzle react-scripts start",
-    "build": "react-scripts build"
+    "build": "wuzzle react-scripts build"
  }
```

Just prepend the `wuzzle` command and add a `wuzzle.config.js` file in app root to make alteration:

```js
module.exports = (webpackConfig, webpack) => {
  // ...
};
```

The `webpackConfig` is the webpack config generated in target bundler to setup its webpack compilation and the `webpack` is the webpack object itself imported inside. Tweak the `webpackConfig` to setup or teardown any parts of it to fit the need. Also, an env variable `WUZZLE_COMMAND_ARGS` is available to help check any arguments of current execution in `wuzzle.config.js`. For now, the hijacking and altering is tested against [CRA](https://github.com/facebook/create-react-app), [Next](https://github.com/vercel/next.js), [Storybook](https://github.com/storybookjs/storybook/), [Razzle](https://github.com/jaredpalmer/razzle), [Taro](https://github.com/nervjs/taro), [EW](https://github.com/electron-userland/electron-webpack) and [Webpack](https://github.com/webpack/webpack). (And it's supposed to work well with other bundles.)

### Transpiling

Use the command `wuzzle tranpsile` to make transpilations. It accepts globs and outputs files with the same hierarchy as input files:

```bash
$ wuzzle transpile src/**/*.js -d lib
```

The base dir is the longest common path of input files by default. Watch mode can be enabled by `-w`. See more options by `-h`. Also, the tranpiling works with `wuzzle.config.js`.

### Registering

Registering webpack compilations in [Node](https://github.com/nodejs/node), [Mocha](https://github.com/mochajs/mocha), [Jest](https://github.com/facebook/jest) is supported and tested. Prepend `wuzzle` to `node`, `mocha`, `jest` to use it. For the former two, set resolvable file extensions by `-E`. For the later one, debug mode can be enabled by `--inspect` or `--inspect-brk`. Notice that wuzzle will wipe away all the transformers in Jest. See more options by `-H`. Also, the registering works with `wuzzle.config.js`.
