// @flow

const matchReferenceId = /^([a-z]+_)+id$/;

const autoType = name => {
  switch (name) {
    case 'id':
      return 'increment';
    case 'timestamps':
      return 'timestamps';
  }
  if (matchReferenceId.test(name)) {
    return 'reference';
  }
};

const formatColumns = (rawColumnArray: Array<Object>) => {
  return rawColumnArray.reduce((cols, column) => {
    const [[name, type]] = Object.entries(column);
    cols.push({
      name,
      type: type || autoType(name),
      /* :: reference: undefined, */
    });
    if (cols[cols.length - 1].type === 'reference') {
      const matchRelationName = /^([a-z_]+)_id$/;
      const match = matchRelationName.exec(name);
      if (!match || !match[1]) {
        throw new Error(`Reference name is invalid: "${name}"`);
      }
      cols[cols.length - 1].reference = match[1];
    }
    return cols;
  }, []);
};

type Raw = {
  [string]: Array<{ [string]: string | null }>,
};

module.exports = (raw: Raw) => {
  const tablesInitial = raw.user
    ? []
    : [
        {
          name: 'user',
          cols: [
            {
              name: 'id',
              type: 'increment',
            },
            {
              name: 'username',
              type: 'string',
            },
            {
              name: 'email',
              type: 'string',
            },
            {
              name: 'password',
              type: 'string',
            },
          ],
        },
      ];
  const tables = Object.entries(raw).reduce((tables, [name, cols]) => {
    tables.push({
      name,
      cols: formatColumns((cols: any)),
    });
    return tables;
  }, tablesInitial);

  // tables structure: [{ name, cols: [{ name, type: string }] }]

  // TODO Check that all tables have an ID (or other primary key)

  // const simpleTables = tables.filter(table => {
  //   table.cols;
  // });

  return tables;
};
