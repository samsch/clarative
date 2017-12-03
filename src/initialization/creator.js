// @flow
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');
const routes = require('./routes');
const data = require('./data');

const readFile = filePath => {
  try {
    const app = yaml.safeLoad(
      fs.readFileSync(path.resolve(__dirname, '../', filePath), 'utf8')
    );

    return app;
  } catch (e) {
    console.log('Failed to load app config!', e);
    throw e;
  }
};

module.exports = (filePath: string = '../app.yml') => {
  const app = readFile(filePath);

  const setup = {
    route: routes(app.route),
    data: data(app.data),
    about: app.about,
  };

  return setup;
};
