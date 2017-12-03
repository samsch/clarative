// @flow
require('dotenv').config();
const config = require('./config');

const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const bodyParser = require('body-parser');
const Promise = require('bluebird');
const session = require('express-session');
const flash = require('connect-flash');
const KnexSessionStore = require('connect-session-knex')(session);
const R = require('ramda');
const createRenderer = require('./view');
const createRestRoutes = require('./actionFactories/rest');
const createKnex = require('knex');
const createSetup = require('./initialization/creator');

const defaults = require('./defaults');

module.exports = () => {
  const app = express();
  const setup = createSetup();
  const options = R.mergeDeepRight(defaults, setup.about);

  console.log(`Configured with
  ${setup.route.dataRoutes.length} data routes
  ${Object.values(setup.route.clara).reduce(
    (sum, a: any) => a.length + sum,
    0
  )} Clara routes
  ${setup.data.length} database tables
  
  Title: ${setup.about.title}
  `);

  var knex = createKnex({
    client: 'pg',
    connection: config.pgconnection,
    version: '10',
  });

  const renderer = createRenderer('./view/index.html', options);

  const setupRoutes = require('./setup/index')(knex, setup, options, renderer);

  const store = new KnexSessionStore({ knex });

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(
    session({
      secret: config.secret,
      httpOnly: true,
      secure: true,
      resave: false,
      saveUninitialized: false,
      store,
    })
  );
  app.use(flash());

  app.use('/setup', setupRoutes);

  if (setup.route.login) {
    // FEATURE Add ability to have view routes here instead of json responses

    // Add register, login, user middleware, and logout routes.
    require('./user/routes')(setup, options, knex, app);
  }

  const authenticatedMiddleware = (req, res, next) => {
    if (req.user && typeof req.user.id === 'number') {
      next();
    }
    res.status(401).json({
      error: 'User not authenticated, please login.',
    });
  };

  app.get('/user', authenticatedMiddleware, (req, res) => {
    res.json({
      user: req.user,
    });
  });

  Object.entries(setup.route.clara).forEach(([type, routes]) => {
    /* :: if (!Array.isArray(routes)) { throw new Error(); } */
    if (type === 'rest') {
      routes.forEach((route: any) => {
        const data = setup.data.find(table => table.name === route.data);
        app.use(createRestRoutes(knex, authenticatedMiddleware, route, data));
      });
    }
  });

  app.use(
    require('./actionFactories/dataRoutes')(
      setup,
      options,
      knex,
      renderer,
      authenticatedMiddleware
    )
  );

  app.use(express.static('public'));

  // Handle 404 for document requests
  app.get('*', (req, res, next) => {
    if (!req.accepts('html')) {
      next();
      return;
    }
    const options = {
      root: __dirname + '/../public/',
      dotfiles: 'deny',
    };
    res.sendFile('index.html', options, err => {
      if (err) {
        console.log('Failed to send index.html', err);
        res.end();
      }
    });
  });

  // Handle 404 for non-document requests
  app.use((req, res) => {
    res.sendStatus(404);
  });

  // If securePort is defined in config, then we want to enable serving
  // over https on that port. Otherwise, the app is probably being served
  // from behind a proxy which terminates tls.
  if (config.securePort) {
    const httpsServer = https.createServer(
      {
        key: fs.readFileSync(path.resolve(config.tlsKey)),
        cert: fs.readFileSync(path.resolve(config.tlsCert)),
      },
      app
    );
    httpsServer.listen(config.securePort);
    console.log(
      `Example app is server via https on port ${config.securePort}.`
    );
  }

  app.listen(config.port, function() {
    console.log(`Example app listening on port ${config.port}.`);
  });

  return app;
};

module.exports();
