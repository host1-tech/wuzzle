// https://docs.cypress.io/guides/guides/plugins-guide.html

const webpackPreprocessor = require('@cypress/webpack-preprocessor');

module.exports = (on, config) => {
  on('file:preprocessor', webpackPreprocessor({}));
};
