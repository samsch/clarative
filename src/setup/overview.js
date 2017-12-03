// @flow
const React = require('react');
const IndexView = require('../view/Index').default;
const {
  validateTableDefinitions,
  getDatabaseTables,
  doTablesMatchSetup,
} = require('./tableInfo');

module.exports = (
  knex: Function,
  setup: Object,
  options: Object,
  renderer: Function
) => async (req: Object, res: Object) => {
  const tables = await getDatabaseTables(knex);
  if (!tables) {
    res.status(500).send('Failed to retrieve table data');
    return;
  }
  const setupDataValid = validateTableDefinitions(setup.data);
  const [databaseMatchesSetup, databaseDiff] = setupDataValid
    ? doTablesMatchSetup(tables, setup.data)
    : [false, undefined];
  const info = {
    setupDataValid,
    databaseMatchesSetup,
    databaseDiff,
    canCreateDatabaseTables:
      !databaseMatchesSetup &&
      databaseDiff &&
      databaseDiff.missing.every(m => typeof m === 'string') &&
      databaseDiff.extra.length === 0 &&
      databaseDiff.badType.length === 0,
  };
  renderer(
    req,
    res,
    <IndexView
      messages={{ success: req.flash('success'), error: req.flash('error') }}
      setup={setup}
      options={options}
      tables={tables}
      info={info}
    />,
    { title: 'App setup' }
  );
};
