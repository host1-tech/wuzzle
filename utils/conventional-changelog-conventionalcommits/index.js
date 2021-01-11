const changelogPreset = require('conventional-changelog-conventionalcommits');

module.exports = parameters => {
  return changelogPreset(parameters).then(config => {
    const headerPartial = config.writerOpts.headerPartial.replace(/isPatch/, 'false');
    config.writerOpts.headerPartial = headerPartial;
    config.conventionalChangelog.writerOpts.headerPartial = headerPartial;
    return config;
  });
};
