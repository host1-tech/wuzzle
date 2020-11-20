// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  coveragePathIgnorePatterns: ['/node_modules/', '/lib/', '/es/', '/dist/'],
  modulePathIgnorePatterns: ['/node_modules/', '/fixtures/'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 15000,
};
