const Server = require('./lib/index');

const Manifest = require('./config/manifest');
const Config = require('../config/config');
const Constants = require('../config/constants');

const S3API = require('./lib/integrations/s3');

const DB = require('./lib/models/db');
const { BaseModel } = require('./lib/models/base');

// const { ModelService } = require('./lib/services/model');

const { BaseSerializer } = require('./lib/serializers/base');

const DBUtil = require('./lib/utils/db');
const FileUtil = require('./lib/utils/file');
const LogUtil = require('./lib/utils/log');
const JsonApiUtil = require('./lib/utils/jsonapi');
const { Token: TokenUtil } = require('./lib/utils/token');
const { GeneralUtil } = require('./lib/utils/general');
const { SessionUtil } = require('./lib/utils/session');

const APIPlugin = require('./lib/plugins/api');
const AuthPlugin = require('./lib/plugins/auth');

const internals = {
  globalModels: {},
};

// emails

const integrations = {
  S3API,
};

const models = {
  registry: {
    get: (name) => internals.globalModels[name],
    set: (name, model) => {
      internals.globalModels[name] = model;
    },
  },
  DB,
  BaseModel,
};

const plugins = {
  APIPlugin,
  AuthPlugin,
};

// policies

// const services = {
//   ModelService,
// };

const utils = {
  DBUtil,
  FileUtil,
  GeneralUtil,
  LogUtil,
  TokenUtil,
  JsonApiUtil,
  SessionUtil,
};

const serializers = {
  BaseSerializer,
};

// ==========================================

async function register() {
  process.stdout.write('core-api loaded');
}

module.exports = {
  plugin: {
    name: 'core-api',
    version: '1.0.0',
    register,
  },
  start: Server.init,
  server: Server.startServer,
  config: Config,
  constants: Constants,
  manifest: Manifest,

  integrations,
  models,
  plugins,
  // services,
  utils,
  serializers,
};
