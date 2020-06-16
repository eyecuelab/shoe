// const Boom = require('@hapi/boom');
const Good = require('@hapi/good');
const Fs = require('fs');
const Path = require('path');

const Config = require('../../config/config');
const Log = require('../lib/utils/log');

const criteria = {
  env: Config.get('env'),
  isHttps: Config.get('isHttps'),
};

const logger = Log.getAppLogger();
const isProd = criteria.env === 'production';
const debug = isProd ? false : {
  request: ['error'],
};

const defaultPlugins = [{
  plugin: 'hapi-auth-jwt2',
},
{
  plugin: '@hapi/vision',
},
{
  plugin: './plugins/auth',
},
{
  plugin: './plugins/api',
}];

let customPlugins = [];
const customPluginsFile = Path.resolve('../../config/plugins.js');

if (Fs.existsSync(customPluginsFile)) {
  // eslint-disable-next-line global-require, import/no-dynamic-require
  customPlugins = require(customPluginsFile)(Path.resolve(Path.join(__dirname, '../lib')));
} else {
  customPlugins = defaultPlugins;
}

const manifest = {
  server: {
    // cache: 'redis',
    port: Config.get('customApiPort'),
    debug,
    routes: {
      security: true,
      cors: true,
      validate: {
        failAction: async (request, h, err) => {
          // if (isProd) {
          //   logger.error('ValidationError:', err);
          //   return Boom.badRequest('Invalid request payload input');
          // }

          // logger.error(isProd, err);
          throw err;
        },
      },
    },
  },
  register: {
    plugins: customPlugins,
  },
};

if (criteria.env !== 'test') {
  const goodPlugin = {
    plugin: Good,

    options: {
      reporters: {
        // bunyan
        myBunyanReporter: [{
          module: 'good-bunyan',
          args: [{
            ops: '*',
            response: '*',
            log: '*',
            error: '*',
            request: '*',
          }, {
            logger,
          }],
        }],
      },
    },
  };

  manifest.register.plugins.unshift(goodPlugin);
}

/*
 - "example.com"
 - "*.example.com"
 - "localhost"
 - "127.0.0.1"
 - "::1"
*/
if (criteria.isHttps) {
  const tlsOptions = {
    key: Fs.readFileSync('./ssl/example.com+4-key.pem'),
    cert: Fs.readFileSync('./ssl/example.com+4.pem'),
  };

  manifest.server.tls = tlsOptions;
  // manifest.server.port = 8443;
}

module.exports = manifest;
