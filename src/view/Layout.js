import React from 'react';
import PropTypes from 'prop-types';

const Layout = props => (
  <div className="layout">
    <header>
      <h1>{props.title}</h1>
    </header>
    <nav>
      <ul>
        <li>
          <a href="/setup">Setup</a>
        </li>
        <li>
          <a href="/setup/database-to-setup">Database to Setup</a>
        </li>
      </ul>
    </nav>
    {props.messages.success ? (
      <ul>
        {' '}
        {props.messages.success.map((msg, i) => (
          <li key={i}>Success: {msg}</li>
        ))}
      </ul>
    ) : null}
    {props.messages.error ? (
      <ul>
        {props.messages.error.map((msg, i) => <li key={i}>Error: {msg}</li>)}
      </ul>
    ) : null}
    <content>{props.children}</content>
  </div>
);
Layout.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  messages: PropTypes.shape({
    success: PropTypes.arrayOf(PropTypes.string),
    error: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
};
export default Layout;
