const Path = require('path');
const Config = require('./config/config.js');

const migrationsPath = Path.resolve('./db/migrations');
const dbConfiguration = {
  client: 'pg',
  connection: {
    host: Config.get('db.host'),
    database: Config.get('db.name'),
    user: Config.get('db.user'),
    password: Config.get('db.password'),
    port: Config.get('db.port'),
    ssl: Config.get('db.ssl'),
  },
  pool: {
    min: 5,
    max: 10,
    afterCreate: (connection, callback) => {
      connection.query("SET timezone = 'UTC';", (err) => {
        callback(err, connection);
      });
    },
  },
  migrations: {
    directory: migrationsPath,
    tableName: 'knex_migrations',
    // sortDirsSeparately: true,
  },
  seeds: {
    directory: './db/seeds',
  },
};

module.exports = {
  development: dbConfiguration,
  test: dbConfiguration,
  production: dbConfiguration,
  staging: dbConfiguration,
};
