const jsRules = {
  'no-constant-condition': 'off',
  'no-empty': 'off',
  'no-undef': 'error',
  'no-unused-vars': 'warn',
  'prefer-const': 'warn',
  eqeqeq: 'warn',
};

const tsRules = {
  ...jsRules,
  '@typescript-eslint/ban-ts-comment': 'off',
  '@typescript-eslint/ban-types': 'off',
  '@typescript-eslint/explicit-module-boundary-types': 'off',
  '@typescript-eslint/no-empty-function': 'off',
  '@typescript-eslint/no-empty-interface': 'off',
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/no-inferrable-types': 'off',
  '@typescript-eslint/no-non-null-assertion': 'off',
  '@typescript-eslint/no-unused-vars': 'warn',
  '@typescript-eslint/no-var-requires': 'off',
};

const jsonRules = {
  'json/*': ['warn', 'allowComments'],
};

module.exports = {
  root: true,
  plugins: ['react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
    'prettier/react',
  ],
  env: {
    es2020: true,
    node: true,
    browser: true,
    jest: true,
  },
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2020,
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: jsRules,
  overrides: [
    {
      files: ['**/*.ts?(x)'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint', 'react', 'react-hooks'],
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'prettier',
        'prettier/react',
        'prettier/@typescript-eslint',
      ],
      rules: tsRules,
    },
    {
      files: ['**/*.json'],
      plugins: ['json'],
      extends: ['plugin:json/recommended'],
      rules: jsonRules,
    },
  ],
};
