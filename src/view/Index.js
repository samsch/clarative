// @flow
import React from 'react';
import Layout from './Layout';

const displayDefaultValueForType = type => {
  switch (type) {
    case 'increment':
      return 'inc(integer)';
    case 'string':
      return "''";
    case 'number':
      return '0';
    case 'timestamp':
      return 'NOW';
    case 'reference':
      return 'N/A';
    default:
      return '';
  }
};

const App = (props: any) => (
  <Layout {...props}>
    <div>
      <h2>Real Database Tables</h2>
      <table className="pure-table pure-table-bordered">
        <thead>
          <tr>
            <th>Table</th>
            <th>Column</th>
            <th>Type</th>
            <th>Default</th>
            <th>Constraint Name</th>
            <th>Constraint Type</th>
            <th>Foreign Table</th>
            <th>Foreign Column</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(props.tables).map((table: any) =>
            table.map((column: any, index) => (
              <tr key={index}>
                <td>{column.table_name}</td>
                <td>{column.column_name}</td>
                <td>{column.data_type}</td>
                <td>{column.column_default}</td>
                <td>{column.constraint_name}</td>
                <td>{column.constraint_type}</td>
                <td>{column.foreign_table_name}</td>
                <td>{column.foreign_column_name}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    <div>
      <h2>Desired Tables</h2>
      {props.info.setupDataValid ? (
        <table className="pure-table pure-table-bordered">
          <thead>
            <tr>
              <th>Table</th>
              <th>Column</th>
              <th>Type</th>
              <th>Default</th>
            </tr>
          </thead>
          <tbody>
            {props.setup.data.map((table: any) =>
              table.cols.map((column: any, index) => (
                <tr key={index}>
                  <td>{table.name}</td>
                  <td>{column.name}</td>
                  <td>{column.type}</td>
                  <td>{displayDefaultValueForType(column.type)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      ) : (
        <div>Setup config is invalid</div>
      )}
    </div>
    {props.info.setupDataValid ? (
      <div>
        <h2>Setup vs Database</h2>
        <table className="pure-table pure-table-bordered">
          <tbody>
            <tr>
              <th>Valid</th>
              <td>{props.info.setupDataValid ? 'true' : 'false'}</td>
            </tr>
            <tr>
              <th>Database matches setup</th>
              <td>{props.info.databaseMatchesSetup ? 'true' : 'false'}</td>
            </tr>
            {props.info.databaseMatchesSetup
              ? null
              : [
                  <tr key="m">
                    <th rowSpan="3">Difference</th>
                    <th>Missing</th>
                    <td>
                      <ul>
                        {props.info.databaseDiff.missing.map(
                          (missing, index) => (
                            <li key={index}>
                              {typeof missing === 'string'
                                ? `Table: ${missing}`
                                : `Columns: ${
                                    missing.table
                                  }: ${missing.columns.join(', ')}`}
                            </li>
                          )
                        )}
                      </ul>
                    </td>
                  </tr>,
                  <tr key="e">
                    <th>Extra Fields</th>
                    <td>
                      <ul>
                        {props.info.databaseDiff.extra.map((extra, index) => (
                          <li key={index}>
                            {`Columns: ${extra.table}: ${extra.columns.join(
                              ', '
                            )}`}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>,
                  <tr key="b">
                    <th>Incorrect Types</th>
                    <td>
                      <ul>
                        {props.info.databaseDiff.badType.map(
                          (badType, index) => (
                            <li key={index}>
                              {`Columns: ${
                                badType.table
                              }: ${badType.columns.join(', ')}`}
                            </li>
                          )
                        )}
                      </ul>
                    </td>
                  </tr>,
                ]}
          </tbody>
        </table>
        {props.info.canCreateDatabaseTables ? (
          <div>
            <form action="/setup/create-tables" method="POST">
              <button type="submit">Create Database Tables</button>
            </form>
          </div>
        ) : null}
      </div>
    ) : null}
  </Layout>
);

export default App;
