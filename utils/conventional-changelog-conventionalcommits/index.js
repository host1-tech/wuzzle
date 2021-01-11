const changelogPreset = require('conventional-changelog-conventionalcommits');
const fs = require('fs');
const path = require('path');

module.exports = parameters =>
  changelogPreset(parameters).then(result => {
    result.writerOpts.headerPartial = fs.readFileSync(
      path.resolve(__dirname, './templates/header.hbs'),
      'utf-8'
    );
    return result;
  });
