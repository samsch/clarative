// @flow
import React from 'react';
import Layout from './Layout';
import yaml from 'js-yaml';

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

const GeneratedSetupData = (props: any) => (
  <Layout {...props}>
    <div>
      <h2>Generated Config</h2>
      {props.info.generationError ? (
        <div>Failed to generate setup data: {props.info.generationError}</div>
      ) : (
        <div>
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
              {props.info.setupData.map((table: any) =>
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
          <pre>
            {yaml.safeDump(props.info.setupDataJson, {
              styles: {
                '!!null': 'canonical', // dump null as ~
              },
            })}
          </pre>
        </div>
      )}
    </div>
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
  </Layout>
);

export default GeneratedSetupData;
