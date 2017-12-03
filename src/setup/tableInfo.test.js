const { doTablesMatchSetup } = require('./tableInfo');

describe('When run with a matched dataset and database, getDatabaseTables', () => {
  it('returns [true, { missing: [], extra: [], badType: []}]', () => {
    const setupData = [
      {
        name: 'user',
        cols: [
          {
            name: 'id',
            type: 'increment',
          },
          {
            name: 'name',
            type: 'string',
          },
          {
            name: 'position',
            type: 'integer',
          },
          {
            name: 'p',
            type: 'number',
          },
          {
            name: 'timestamps',
            type: 'timestamps',
          },
        ],
      },
    ];
    const databaseTables = {
      user: [
        {
          table_name: 'user',
          column_name: 'id',
          data_type: 'integer',
          column_default: "nextval('author_id_seq'::regclass)",
        },
        {
          table_name: 'user',
          column_name: 'name',
          data_type: 'text',
          column_default: '',
        },
        {
          table_name: 'user',
          column_name: 'position',
          data_type: 'integer',
          column_default: 0,
        },
        {
          table_name: 'user',
          column_name: 'p',
          data_type: 'numeric',
          column_default: 0,
        },
        {
          table_name: 'user',
          column_name: 'created_at',
          data_type: 'timestamp with time zone',
          column_default: 0,
        },
        {
          table_name: 'user',
          column_name: 'updated_at',
          data_type: 'timestamp with time zone',
          column_default: 0,
        },
      ],
    };
    expect(doTablesMatchSetup(databaseTables, setupData)).toEqual([
      true,
      { missing: [], extra: [], badType: [] },
    ]);
  });
});

describe('When run with an unmatched dataset and database, getDatabaseTables', () => {
  it('returns [false, { missing: [...], extra: [...], badType: [...]}]', () => {
    const setupData = [
      {
        name: 'user',
        cols: [
          {
            name: 'id',
            type: 'increment',
          },
          {
            name: 'name',
            type: 'string',
          },
          {
            name: 'position',
            type: 'integer',
          },
          {
            name: 'p',
            type: 'number',
          },
          {
            name: 'missing',
            type: 'string',
          },
        ],
      },
      {
        name: 'missing_table',
        cols: [
          {
            name: 'id',
            type: 'increment',
          },
        ],
      },
    ];
    const databaseTables = {
      user: [
        {
          table_name: 'user',
          column_name: 'id',
          data_type: 'integer',
          column_default: "nextval('author_id_seq'::regclass)",
        },
        {
          table_name: 'user',
          column_name: 'name',
          data_type: 'numeric',
          column_default: '',
        },
        {
          table_name: 'user',
          column_name: 'position',
          data_type: 'integer',
          column_default: 0,
        },
        {
          table_name: 'user',
          column_name: 'p',
          data_type: 'numeric',
          column_default: 0,
        },
        {
          table_name: 'user',
          column_name: 'extra',
          data_type: 'numeric',
          column_default: 0,
        },
      ],
    };
    expect(doTablesMatchSetup(databaseTables, setupData)).toEqual([
      false,
      {
        missing: [{ table: 'user', columns: ['missing'] }, 'missing_table'],
        extra: [
          {
            table: 'user',
            columns: [
              {
                table_name: 'user',
                column_name: 'extra',
                data_type: 'numeric',
                column_default: 0,
              },
            ],
          },
        ],
        badType: [{ table: 'user', columns: ['name'] }],
      },
    ]);
  });
});
