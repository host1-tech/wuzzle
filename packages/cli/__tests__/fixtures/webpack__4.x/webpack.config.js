const path = require('path');

module.exports = {
  mode: 'development',
  entry: path.resolve('src/index.js'),
  output: {
    filename: 'index.js',
    path: path.resolve('dist'),
  },
};
