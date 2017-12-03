// @flow
const R = require('ramda');
const React = require('react');
const { getDatabaseTables } = require('./tableInfo');
const GeneratedSetupData = require('../view/GeneratedSetupData').default;

const referenceNameTest = (() => {
  const test = /^([a-z]+(_[a-z]+)*)_id$/;
  return (name, ref) => {
    const match = test.exec(name);
    return match !== null && match[1] === ref;
  };
})();

const getSetupType = column => {
  switch (column.data_type) {
    case 'integer':
      if (column.constraint_type === 'PRIMARY KEY') {
        if (column.column_name !== 'id') {
          throw new Error(
            `Primary key should be named 'id' in table: ${column.table_name}`
          );
        }
        return 'increment';
      }
      if (column.constraint_type === 'FOREIGN KEY') {
        if (!referenceNameTest(column.column_name, column.foreign_table_name)) {
          throw new Error(
            `Badly named foreign key: ${column.table_name}.${
              column.column_name
            }`
          );
        }
        return 'reference';
      }
      return 'integer';
    case 'text':
      return 'string';
    case 'decimal':
      return 'decimal';
    case 'timestamp':
      return 'timestamp';
    case 'timestamps':
      return 'timestamps';
    default:
      throw new Error(
        `Unknown column data type: ${column.table_name}.${
          column.column_name
        }: ${column.data_type}`
      );
  }
};

const getShortType = (name, type) => {
  switch (type) {
    case 'increment':
      return name === 'id' ? null : 'increment';
    case 'reference':
      return null;
    case 'timestamps':
      return name === 'timestamps' ? null : 'timestamps';
    default:
      return type;
  }
};

const createSetupTables = (tables: Array<Object>) => {
  const getTableReferences = table => {
    return table.columns.reduce((refs, column) => {
      return column.constraint_type === 'FOREIGN KEY'
        ? refs.concat(column.foreign_table_name)
        : refs;
    }, []);
  };
  const allTablesReferences = tables.map(table => {
    return {
      table,
      references: getTableReferences(table),
    };
  });

  const sortedTables = (() => {
    const sortRecursor = (rest, out) => {
      if (rest.length === 0) {
        return out;
      }
      const nextIndex = rest.findIndex(({ references }) => {
        return references.every(tableName => {
          return out.some(outTable => outTable.name === tableName);
        });
      });
      if (nextIndex === -1) {
        throw new Error('Circular reference in database?');
      }
      return sortRecursor(
        R.remove(nextIndex, 1, rest),
        out.concat(rest[nextIndex].table)
      );
    };
    return sortRecursor(allTablesReferences, []);
  })();

  const setupData = sortedTables.map(table => {
    const timestamps = { created_at: -1, updated_at: -1 };
    let tableColumns = table.columns.reduce((columns, column, index) => {
      if (column.column_name === 'created_at') {
        timestamps.created_at = index;
      } else if (column.column_name === 'updated_at') {
        timestamps.updated_at = index;
      } else {
        columns.push({
          name: column.column_name,
          type: getSetupType(column),
        });
      }
      return columns;
    }, []);
    if (timestamps.created_at > -1 && timestamps.updated_at > -1) {
      tableColumns.push({
        name: 'timestamps',
        type: 'timestamps',
      });
    } else {
      if (timestamps.created_at > -1) {
        tableColumns = R.insert(
          timestamps.created_at,
          {
            name: 'create_at',
            type: 'timestamp',
          },
          tableColumns
        );
      }
      if (timestamps.updated_at > -1) {
        tableColumns = R.insert(
          timestamps.updated_at,
          {
            name: 'updated_at',
            type: 'timestamp',
          },
          tableColumns
        );
      }
    }
    return {
      name: table.name,
      cols: tableColumns,
    };
  });

  const setupDataJson = setupData.reduce((formatted, { name, cols }) => {
    formatted[name] = cols.map(column => ({
      [column.name]: getShortType(column.name, column.type),
    }));
    return formatted;
  }, {});

  return {
    setupData,
    setupDataJson,
  };
};

module.exports = (
  knex: Function,
  setup: Object,
  options: Object,
  renderer: Function
) => async (req: Object, res: Object) => {
  console.log('Creating setup from database');
  const tablesObj = await getDatabaseTables(knex);
  if (!tablesObj) {
    req.flash('error', 'Failed to load database tables list');
    res.redirect(303, '/setup');
    return;
  }

  const tables = Object.entries(tablesObj).map(([name, columns]) => ({
    name,
    columns,
  }));
  /*
  tables structure: [{
    name,
    columns: [{
      column_name,
      data_type,
      column_default,
      constraint_name,
      constraint_type,
      foreign_table_name,
      foreign_column_name
    }]
  }]
  */
  // setup.data structure: [{ name, cols: [{ name, type: string }] }]

  const {
    data: { setupData, setupDataJson },
    error: generationError,
  } = (() => {
    try {
      return { data: createSetupTables(tables), error: false };
    } catch (error) {
      console.log('Failed to generated setup data from database', error);
      return { data: {}, error: error.message };
    }
  })();

  renderer(
    req,
    res,
    <GeneratedSetupData
      messages={{ success: req.flash('success'), error: req.flash('error') }}
      setup={setup}
      options={options}
      tables={tablesObj}
      info={{
        generationError,
        setupData,
        setupDataJson,
      }}
    />,
    { title: 'Generated setup data' }
  );
};
