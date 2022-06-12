# Contributing to Wuzzle

## Submission Guidelines

### Submitting an Issue

If you have discovered a bug or have a feature suggestion, please [submit a new issue on GitHub](https://github.com/host1-tech/wuzzle/issues/new).

Also, in case an issue for your problem might already exist, please search the [issue tracker](https://github.com/host1-tech/wuzzle/issues) first.

### Submitting a Pull Request

To commit changes, please checkout a new branch with a name format `author-name/change-brief` from the latest `master` branch.

On writing commit messages, please follow [conventional commits](https://www.conventionalcommits.org/).

And, on changes done, create a PR with a descriptive title. Once the PR gets approved, you become able to merge it.

On any changes merged into `master` branch, an alpha version will get published and you may just use it for a preliminary trial.

## Local Setup

At wuzzle, packages and dependencies are managed with [yarn 1.x](https://github.com/yarnpkg/yarn) and [lerna](https://github.com/lerna/lerna). By running `yarn` in the root dir of the project, you can have all the dependencies installed and all the source code compiled. More preset commands can be found by checking `scripts` field in `package.json` file:

- `yarn build`: compiles source code with type checking.
- `yarn watch`: does the same as `yarn build` but in watch mode.
- `yarn clean`: cleans generated files.
- `yarn test`: runs unit tests.
- `yarn coverage`: does the same as `yarn test` but with coverage enabled.
- `yarn e2e`: runs end-to-end tests.
- `yarn lint`: checks problems.
- `yarn fix`: tries to fix problems found in `yarn lint`.
- `yarn fixtures install`: installs dependencies of fixture apps for e2e tests.

Often, you can keep `yarn watch` running to do compilation and type checking continuously. And you can append a relative file path to `yarn test/coverage/e2e` to specify tests to run. Please just make best of commands above to help yourself.

## Codebase Overview

```sh
e2e               # End-to-end tests.
packages
├── cli           # The core package under the hood, provides all the commands and all the modules.
├── config-tools  # Modification utilities on webpack configs.
├── helpers       # Helpers of internal common logics.
└── wuzzle        # The alias package, wraps the core package.
scripts           # Extended scripts.
utils             # Script utilities.
```

## Code Of Conduct

Wuzzle has adopted a Code of Conduct that we expect project participants to adhere to. Please read [the full text](https://github.com/host1-tech/wuzzle/blob/master/CODE_OF_CONDUCT.md) so that you can understand what actions will and will not be tolerated.
