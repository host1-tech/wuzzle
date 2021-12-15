const path = require('path');
module.exports = {
  testMatch: ['**/src/**/?(*.)+(spec|test).[jt]s?(x)'],
  coverageReporters: ['text'],
  cacheDirectory: path.join(__dirname, 'node_modules/.cache/jest'),
};
