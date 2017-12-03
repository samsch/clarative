// @flow
const Promise = require('bluebird');
const scrypt = require('scrypt-for-humans');
const loginHandler = require('./login');

module.exports = (
  setup: Object,
  options: Object,
  knex: Function,
  app: Object
) => {
  app.post(
    (setup.route.login &&
      setup.route.login.logout &&
      setup.route.login.logout.path) ||
      options.login.logout.path,
    (req, res) => {
      if (
        !req.body.email ||
        !req.body.name ||
        !req.body[options.user.database.loginName] ||
        !req.body.password
      ) {
        res.status(400).json({
          error:
            'Missing request parameter(s). Expected json object with email and password keys.',
        });
        return;
      }
      if (req.body.password.length < 6) {
        res.status(400).json({
          error: 'Password must be at least 6 characters',
        });
        return;
      }
      (async () => {
        const users = await knex('user').where({
          [options.user.database.loginName]:
            req.body[options.user.database.loginName],
        });
        if (users.length !== 0) {
          res.status(409).json({
            error: 'Username already in use',
          });
          return;
        }
        const hashedPassword = await scrypt.has(req.body.password);
        const userId = await knex('user')
          .insert({
            [options.user.database.loginName]:
              req.body[options.user.database.loginName],
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
          })
          .returning('id');
        res.json({
          message: 'User created successfully',
          user: {
            id: userId,
            name: req.body.name,
            [options.user.database.loginName]:
              req.body[options.user.database.loginName],
            email: req.body.email,
          },
        });
      })().catch(error => {
        console.log('user/login Registration error: ', error);
        res.status(500).json({
          error: 'Sorry, something went wrong processing your request',
        });
      });
    }
  );

  app.post(
    setup.route.login.path || options.login.path,
    loginHandler(knex, options)
  );

  app.use((req, res, next) => {
    if (!req.session.userId) {
      next();
      return;
    }
    Promise.try(() => {
      const userId = req.session.userId;
      return knex('user').where({ id: userId });
    })
      .then(users => {
        if (users.length === 1) {
          req.user = users[0];
        }
        next();
      })
      .catch(() => {
        res.status(500).json({
          error:
            'Something went wrong processing your request, please try again.',
        });
      });
  });

  app.post(
    (setup.route.login &&
      setup.route.login.logout &&
      setup.route.login.logout.path) ||
      options.login.logout.path,
    (req, res) => {
      req.session.destroy(err => {
        if (err) {
          res.status(500).json({
            error: 'Failed to log user out',
          });
        } else {
          res.json({
            message: 'You are now logged out',
          });
        }
      });
    }
  );
};
