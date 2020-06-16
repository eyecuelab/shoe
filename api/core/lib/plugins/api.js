import extend from 'extend';
import path from 'path';
import glob from 'glob';
import Mrhorse from 'mrhorse';
import HapiSwagger from 'hapi-swagger';
import Inert from '@hapi/inert';
import Vision from '@hapi/vision';
import url from 'url';
import Jsonfile from 'jsonfile';
import Promise from 'bluebird';

import Log from '../utils/log';
import { GeneralUtil } from '../utils/general';
import Config from '../../../config/config';
import Constants from '../../../config/constants';

const NAME = 'APIPlugin';

class APIPlugin {
  constructor() {
    this.log = Log.getLogger(NAME);
    GeneralUtil.BindAll(this);
  }

  // ---------------------------------------------------
  async registerMrHorse(server, config) {
    this.log.debug('register-MrHorse');
    const policyPath = config.get('policyPath');
    this.log.debug('policyPath %j', policyPath);

    await server.register([
      Inert,
      Vision,
      {
        plugin: Mrhorse,
        options: {
          policyDirectory: policyPath,
        },
      },
    ]);

    if (config.enablePolicies) {
      await server.plugins.mrhorse.loadPolicies(server, {
        policyDirectory: path.join(__dirname, '/policies'),
      });
    }

    this.log.debug('MrHorse plugin registered');
  }

  // ---------------------------------------------------
  async registerHapiSwagger(server, config) {
    this.log.debug('register-HapiSwagger');
    const packageJson = await Jsonfile.readFileSync('package.json');

    const apiURLString = config.get('apiURL');
    const apiURL = new url.URL(apiURLString);

    const scheme = apiURL.protocol.replace(':', '');
    const {
      host,
    } = apiURL;

    await server.register([{
      plugin: HapiSwagger,
      options: {
        schemes: [scheme],
        host,
        info: {
          title: `${config.get('projectName')} Docs`,
          version: packageJson.version,
        },
      },
    }]);

    this.log.debug('HapiSwagger plugin registered');
  }

  // ---------------------------------------------------
  registerApi(server, config) {
    this.log.debug('register-API');
    const apiPath = config.get('apiPath');

    if (apiPath === null || apiPath === '') {
      throw new Error('Config apiPath not set!');
    }
    const apiPaths = [apiPath];

    const loadAPIs = (apiFolder) => {
      this.log.debug('reading apiFolder = %j', apiFolder);
      return new Promise((resolve, reject) => {
        glob(`${apiFolder}/**/*.js`, async (err, files) => {
          if (err) {
            reject(err);
          }
          await Promise.map(files, (file) => {
            const fileName = path.basename(file, '.js');

            if (fileName.toLowerCase() === 'routes') {
              const routeFile = path.resolve(file);
              this.log.debug('loading %j', routeFile);
              // eslint-disable-next-line global-require, import/no-dynamic-require
              require(routeFile)(server);
            }
          }, { concurrency: 10 });

          resolve();
        });
      });
    };

    return Promise.map(apiPaths, (apiDir) => loadAPIs(apiDir));
  }

  // ---------------------------------------------------
  async register(server, options) {
    this.log.info('Register %j', NAME);

    const config = Config;
    extend(true, config, options.config);

    server.ext('onRequest', (request, h) => {
      request.logger = this.log;

      return h.continue;
    });

    server.auth.default(Constants.AUTH_STRATEGIES.SESSION);

    // swagger
    await this.registerHapiSwagger(server, config);

    // policies
    await this.registerMrHorse(server, config);

    // register routes
    return this.registerApi(server, config);
  }
}

// ---------------------------------------------------
module.exports = (() => {
  const plugin = new APIPlugin();
  return {
    name: NAME,
    register: plugin.register,

    instance: plugin,
    APIPlugin, // testing only
  };
})();
