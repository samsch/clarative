// @flow
const { omit } = require('ramda');

const getPath = (raw, index) => {
  const keys = Object.keys(raw);
  if (keys.length === 0) {
    throw new Error(`Route at index ${index} is missing.`);
  }
  if (keys.length > 1) {
    throw new Error(
      `Route at index ${
        index
      } is not properly formatted. Be sure you indented the route properties after the path.`
    );
  }
  return keys[0];
};

type RouteConfig = {
  login: {
    path: ?string,
    logout: ?{
      path: ?string,
    },
  },
  clara: {
    [string]: Array<{ path: string, [string]: any }>,
  },
  dataRoutes: Array<{
    path: string,
    login: ?string,
    data: ?string,
    view: ?string,
  }>,
};

module.exports = (routes: Array<Object>): RouteConfig => {
  let login = false;

  const { dataRoutes, clara } = routes.reduce(
    (res, rawRoute, index) => {
      const path = getPath(rawRoute, index);
      const properties = rawRoute[path];
      if (properties.login === true && !login) {
        login = true;
      }
      if (properties.clara) {
        res.clara[properties.clara] = [
          ...(res.clara[properties.clara] || []),
          Object.assign(properties, {
            path,
          }),
        ];
        return res;
      }
      res.dataRoutes.push(
        Object.assign(properties, {
          path,
        })
      );
      return res;
    },
    {
      dataRoutes: [],
      clara: {},
      login: {},
    }
  );

  // If we received a login route, assign that to login
  // If not, and login is true, then use an empty object
  // Otherwise, let login be false
  login =
    (clara.login && clara.login.length > 0 && clara.login[0]) ||
    (login ? {} : false);

  // If login (which is now an object or false), assign logout properties
  //   if they exist
  if (login && clara.logout && clara.logout.length > 0) {
    login.logout = clara.logout[0];
  }

  return {
    login,
    dataRoutes,
    clara: omit(['login', 'logout'], clara),
  };
};
