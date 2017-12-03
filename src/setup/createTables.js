// @flow
const R = require('ramda');
const { validateTableDefinitions, getDatabaseTables } = require('./tableInfo');

const createReferenceField = (() => {
  return (knex, tableBuilder, column) => {
    tableBuilder
      .integer(column.name)
      .unsigned()
      .references('id')
      .inTable(column.reference);
  };
})();

const createTable = async (knex, table) => {
  return knex.schema.createTable(table.name, tableBuilder => {
    table.cols.forEach(column => {
      switch (column.type) {
        case 'increment':
          tableBuilder.increments(column.name).primary();
          break;
        case 'string':
          tableBuilder.text(column.name);
          break;
        case 'number':
        case 'decimal':
          tableBuilder.decimal(column.name);
          break;
        case 'integer':
          tableBuilder.integer(column.name);
          break;
        case 'timestamps':
          tableBuilder.timestamps(true, true);
          break;
        case 'timestamp':
          tableBuilder.timestamp(column.name).defaultTo(knex.fn.now());
          break;
        case 'reference':
          createReferenceField(knex, tableBuilder, column);
          break;
        default:
          throw new Error(`Unknown column data type: ${column.type}`);
      }
    });
  });
};

const createTables = async (knex, tables) => {
  const getTableReferences = table => {
    return table.cols.reduce((refs, column) => {
      return column.reference ? refs.concat(column.reference) : refs;
    }, []);
  };
  const allTablesReferences = tables.map(table => {
    return {
      table,
      references: getTableReferences(table),
    };
  });
  const createTablesRecursor = async (unfinished, finished) => {
    if (unfinished.length === 0) {
      return;
    }
    const nextIndex = unfinished.findIndex(({ references }) => {
      return (
        references.length === 0 ||
        references.every(ref => finished.includes(ref))
      );
    });
    console.log('nextTable', nextIndex, unfinished.length);
    const nextTable = unfinished[nextIndex].table;
    await createTable(knex, nextTable);
    await createTablesRecursor(
      R.remove(nextIndex, 1, unfinished),
      finished.concat(nextTable.name)
    );
  };
  return createTablesRecursor(allTablesReferences, []);
};

module.exports = (knex: Function, setup: Object, options: Object) => async (
  req: Object,
  res: Object
) => {
  console.log('Creating database tables');
  const tables = await getDatabaseTables(knex);
  if (!tables) {
    req.flash('error', 'Failed to load current database tables list');
    res.redirect(303, '/setup');
    return;
  }
  // tables structure: { [table_name]: [{ column_name, data_type, column_default }] }
  // setup.data structure: [{ name, cols: [{ name, type: string }] }]

  // if any desired tables already exist in the database
  if (
    setup.data.some((desiredTable: any) => {
      if (tables[desiredTable.name]) {
        return true;
      }
    })
  ) {
    req.flash('error', 'Database already contains some or all tables');
    res.redirect(303, '/setup');
    return;
  }

  if (!validateTableDefinitions(setup.data)) {
    req.flash(
      'error',
      'Data definitions must use valid database names (lowercase with underscore separators) and a proper type'
    );
    res.redirect(303, '/setup');
    return;
  }
  try {
    await createTables(knex, setup.data);
  } catch (error) {
    console.log(
      'Failed to write tables to database; Database in unknown state',
      error
    );
    req.flash(
      'error',
      'Failed to write tables to database; Database in unknown state'
    );
    res.redirect(303, '/setup');
    return;
  }

  req.flash('success', 'Created database tables!');
  res.redirect(303, '/setup');
  return;
};
