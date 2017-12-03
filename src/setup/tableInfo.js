// @flow
const R = require('ramda');

const matchTypeToDatabaseType = (type, column) => {
  switch (type) {
    case 'increment':
      return (
        column.data_type === 'integer' &&
        /^nextval\(.*\)$/.test(column.column_default)
      );
    case 'string':
      return column.data_type === 'text';
    case 'number':
      return column.data_type === 'numeric';
    case 'integer':
      return column.data_type === 'integer';
    case 'decimal':
      return column.data_type === 'numeric';
    case 'timestamp':
      return column.data_type === 'timestamp with time zone';
    case 'timestamps':
      return column.data_type === 'timestamp with time zone';
    case 'reference':
      return column.data_type === 'integer';
    default:
      return false;
  }
};

const types = [
  'increment',
  'string',
  'number',
  'integer',
  'decimal',
  'timestamps',
  'timestamp',
  'reference',
];

const isValidDBName = (() => {
  const test = /^[a-z]+(_[a-z]+)*$/;
  return name => test.test(name);
})();

module.exports.validateTableDefinitions = tables => {
  return tables.every(table => {
    return (
      isValidDBName(table.name) &&
      table.cols.every(column => {
        return isValidDBName(column.name) && types.includes(column.type);
      })
    );
  });
};

// return/tables structure: { [table_name]: [{ column_name, data_type, column_default }] }
module.exports.getDatabaseTables = async knex => {
  try {
    const result = await knex.raw(
      //       `
      // select
      // table_name,
      // column_name,
      // data_type,
      // column_default
      // from INFORMATION_SCHEMA.COLUMNS
      // where table_schema = 'public' and table_name != 'sessions';
      // `
      `
SELECT
  c.table_name, c.column_name, c.data_type, c.column_default,
  tc.constraint_name, tc.constraint_type,
  ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
FROM
  information_schema.columns AS c
    LEFT JOIN information_schema.key_column_usage AS kcu
      ON c.table_name = kcu.table_name and c.column_name = kcu.column_name
    LEFT JOIN information_schema.table_constraints AS tc
      ON tc.constraint_name = kcu.constraint_name
    LEFT JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE
  c.table_schema = 'public' and c.table_name != 'sessions';
`
    );
    if (!result) {
      return false;
    }
    return result.rows.reduce((tables, column) => {
      tables[column.table_name] = (tables[column.table_name] || []).concat(
        column
      );
      return tables;
    }, {});
  } catch (error) {
    return null;
  }
};

module.exports.doTablesMatchSetup = (
  databaseTables: Object,
  setupData: Array<Object>
) => {
  const result = setupData.reduce(
    (result, setupTable) => {
      const dbTable = databaseTables[setupTable.name];
      if (!dbTable) {
        result.missing.push(setupTable.name);
        return result;
      }

      let dbTableColumns = dbTable.slice();
      let badType = [];
      const convertedColumns = setupTable.cols.reduce((cols, column) => {
        // const referenceMatch = referenceNameTest(column.name);
        if (column.name === 'timestamps' && column.type === 'timestamps') {
          cols.push({
            name: 'created_at',
            type: 'timestamps',
          });
          cols.push({
            name: 'updated_at',
            type: 'timestamps',
          });
        } else {
          cols.push(column);
        }
        return cols;
      }, []);
      const missingColumns = convertedColumns.reduce((missing, column) => {
        const index = dbTableColumns.findIndex(
          col => col.column_name === column.name
        );
        if (index === -1) {
          return missing.concat(column.name);
        }
        badType = matchTypeToDatabaseType(column.type, dbTableColumns[index])
          ? badType
          : badType.concat(column.name);
        dbTableColumns = R.remove(index, 1, dbTableColumns);
        return missing;
      }, []);

      return {
        missing:
          missingColumns.length > 0
            ? result.missing.concat({
                table: setupTable.name,
                columns: missingColumns,
              })
            : result.missing,
        extra:
          dbTableColumns.length > 0
            ? result.extra.concat({
                table: setupTable.name,
                columns: dbTableColumns,
              })
            : result.extra,
        badType:
          badType.length > 0
            ? result.badType.concat({
                table: setupTable.name,
                columns: badType,
              })
            : result.badType,
      };
    },
    {
      missing: [],
      extra: [],
      badType: [],
    }
  );
  return [
    result.missing.length === 0 &&
      result.extra.length === 0 &&
      result.badType.length === 0,
    result,
  ];
};
