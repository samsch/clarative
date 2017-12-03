// @flow
const React = require('react');
const express = require('express');
const Promise = require('bluebird');
const overview = require('./overview');
const createTables = require('./createTables');
const createSetupData = require('./createSetupData');

module.exports = (
  knex: Function,
  setup: Object,
  options: Object,
  renderer: Function
) => {
  const router = express.Router();

  router.get('/', overview(knex, setup, options, renderer));
  router.post('/create-tables', createTables(knex, setup, options));
  router.get(
    '/database-to-setup',
    createSetupData(knex, setup, options, renderer)
  );

  return router;
};
