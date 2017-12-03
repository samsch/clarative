// @flow
const Promise = require('bluebird');
const scrypt = require('scrypt-for-humans');
const randomNumber = require('random-number-csprng');

module.exports = (knex: Function, options: Object) => (
  req: Object,
  res: Object
) => {
  if (!req.body.email || !req.body.password) {
    res.status(400).json({
      error:
        'Missing request parameter(s). Expected json object with email and password keys.',
    });
    return;
  }
  Promise.try(function() {
    return randomNumber(0, 200);
  })
    .then(random => {
      return Promise.all([
        Promise.delay(random),
        knex('user').where({
          [options.user.database.loginName]:
            req.body[options.login.userBodyField],
        }),
      ]);
    })
    .then(([, users]) => {
      if (users.length !== 1) {
        throw new Error('invalid');
      }
      return scrypt
        .verifyHash(req.body.password, users[0].password)
        .then(() =>
          Promise.fromCallback(callback =>
            req.session.regenerate(callback)
          ).catch(err => {
            console.log('Failed to regenerate session for login', err);
            return err;
          })
        )
        .then(() => {
          req.session.userId = users[0].id;
          res.json({
            message: 'Successfully logged in',
            user: users[0],
          });
        });
    })
    .catch(() => {
      req.session.destroy(err => {
        if (err) {
          console.log('Failed to destroy session on bad login', err);
        }
        res.json({
          error: 'Invalid email or password',
        });
      });
    });
};
