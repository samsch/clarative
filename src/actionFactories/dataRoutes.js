// @flow
const React = require('react');
const express = require('express');
const getPublicProperties = require('../user/getPublicProperties');

module.exports = (
  setup: Object,
  options: Object,
  knex: Function,
  renderer: Function,
  authenticatedMiddleware: Function
) => {
  const router = express.Router();

  setup.route.dataRoutes.forEach(route => {
    const handler = (req, res) => {
      if (req.accepts('html') && route.view) {
        // $FlowIgnore Non-literal string require argument
        const Component = require('../view/' + route.view).default;
        renderer(
          req,
          res,
          <Component
            title={route.title || options.title}
            user={req.user ? getPublicProperties(options, req.user) : null}
          />
        );
      }
    };
    if (route.login) {
      router.get(route.path, authenticatedMiddleware, handler);
    } else {
      router.get(route.path, handler);
    }
  });

  return router;
};
