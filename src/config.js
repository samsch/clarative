// @flow
const vars = ({
  secret: (process.env.APP_SESSION_SECRET: any),
  port: (process.env.APP_HTTP_PORT: any),
  securePort: (process.env.APP_SECURE_PORT: any),
  tlsKey: (process.env.APP_SECURE_KEY: any),
  tlsCert: (process.env.APP_SECURE_CERT: any),
  pgconnection: {
    database: (process.env.PG_USER: any),
    user: (process.env.PG_PASSWORD: any),
    password: (process.env.PG_DATABASE: any),
  },
}: { [string]: string, pgconnection: { [string]: string } });

['secret', 'port', 'securePort', 'tlsKey', 'tlsCert', 'pgconnection'].forEach(
  key => {
    if (!vars[key]) {
      throw new Error(
        'Cannot start application without all required environment vars. Missing: ' +
          key
      );
    }
  }
);

module.exports = vars;
