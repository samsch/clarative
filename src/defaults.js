// @flow
module.exports = {
  viewPath: 'view',
  login: {
    path: '/login',
    logout: {
      path: '/logout',
    },
    postBody: {
      user: 'user',
      password: 'password',
    },
  },
  user: {
    database: {
      table: 'user',
      loginName: 'user',
      password: 'password',
    },
    publicFields: ['id', 'name', 'username'],
  },
};
