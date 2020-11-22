module.exports = {
  modify(webpackConfig) {
    return { ...webpackConfig, output: {} };
  },
};
