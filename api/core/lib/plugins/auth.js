import Boom from '@hapi/boom';
import Hoek from '@hapi/hoek';

import Config from '../../../config/config';
import Constants from '../../../config/constants';
import { User } from '../models/user';
import { Session } from '../models/session';
import Log from '../utils/log';
import { GeneralUtil } from '../utils/general';
import { Token } from '../utils/token';
import { SessionUtil } from '../utils/session';

const { To } = GeneralUtil;
const NAME = 'AuthPlugin';

const CODE_SCHEME = 'code';
const token = new Token();

const internals = {};

internals.basicScheme = (server, options) => {
  Hoek.assert(options, 'Missing code auth strategy options');
  Hoek.assert(typeof options.validate === 'function', 'options.validate must be a valid function in code scheme');

  const settings = Hoek.clone(options);

  const scheme = {
    async authenticate(request, h) {
      const { authorization } = request.headers;
      const { code: queryCode } = request.query || {};
      const { code: payloadCode } = request.payload || {};

      let data = {};

      if (authorization) {
        const parts = authorization.split(/\s+/);

        if (parts[0].toLowerCase() !== CODE_SCHEME) {
          throw Boom.unauthorized(null, CODE_SCHEME, settings.unauthorizedAttributes);
        }

        if (parts.length !== 2) {
          throw Boom.badRequest('Bad HTTP authentication header format', CODE_SCHEME);
        }

        data = token.decodeCode(parts[1]);
      } else if (queryCode) {
        data = token.decodeCode(queryCode);
      } else if (payloadCode) {
        data = token.decodeCode(payloadCode);
      } else {
        throw Boom.unauthorized(null, CODE_SCHEME, settings.unauthorizedAttributes);
      }

      const {
        isValid,
        credentials,
        response,
      } = await settings.validate(data, request, h);

      if (response !== undefined) {
        return h.response(response).takeover();
      }

      if (!isValid) {
        return h.unauthenticated(Boom.unauthorized('Bad CODE', CODE_SCHEME, settings.unauthorizedAttributes), credentials ? {
          credentials,
        } : null);
      }

      if (!credentials || typeof credentials !== 'object') {
        throw Boom.badImplementation('Bad credentials object received for code auth validation');
      }

      return h.authenticated({
        credentials,
      });
    },
  };

  return scheme;
};

class AuthPlugin {
  constructor() {
    this.register = this.register.bind(this);
    this.log = Log.getLogger(NAME);
  }

  static applySessionStrategy(server) {
    server.ext('onPostHandler', (request, reply) => {
      const creds = request.auth.credentials;

      if (creds && request.response.header) {
        // request.response.header(
        //   'X-Access-Token',
        //   Token.createUser(creds.user, creds.scope, Constants.EXPIRATION_PERIOD.SHORT),
        // );

        if (creds.type === 'session') {
          request.response.header(
            'X-Refresh-Token',
            SessionUtil.createSession({
              user_id: creds.user_id,
              id: creds.sessionId,
              key: creds.sessionKey,
              passwordHash: creds.passwordHash,
            }, creds.scope, Constants.EXPIRATION_PERIOD.MEDIUM),
          );
        }
      }

      return reply.continue;
    });

    server.auth.strategy(Constants.AUTH_STRATEGIES.SESSION, 'jwt', {
      key: Config.get('token.secret'),
      verifyOptions: {
        algorithms: ['HS256'],
      },

      validate: async (decoded, request) => {
        if (decoded.type === 'session') {
          const [err, sess] = await To(Session
            .findByCredentials(decoded.sessionId, decoded.sessionKey));
          if (err) return Boom.unauthorized();

          if (!sess || err != null) {
            return {
              isValid: false,
              credentials: null,
            };
          }

          request.sess = sess;

          const id = sess.attributes.user_id;
          const [err2, user] = await To(User.findByID(id));
          if (err2) return Boom.unauthorized();

          if (!user || err2 != null) {
            return {
              isValid: false,
              credentials: null,
            };
          }

          if (user.attributes.password !== decoded.passwordHash) {
            return {
              isValid: false,
              credentials: null,
            };
          }

          request.currentUser = user;

          return {
            isValid: true,
            credentials: decoded,
          };
        }

        return {
          isValid: false,
          credentials: null,
        };
      },
    });
  }

  static customForbiddenMessage(server) {
    server.ext('onPreResponse', (request, h) => {
      if (Boom.isBoom(request.response)) {
        return h.continue;
      }

      const {
        response,
      } = request;

      if (
        response.output
        && response.output.statusCode === 403
        && response.output.payload
        && response.output.payload.message === 'Insufficient scope'
      ) {
        response.output.payload.message = 'Insufficient permissions';
      }

      return h.continue;
    });
  }

  register = (server) => {
    this.log.info('Register %j', NAME);

    AuthPlugin.customForbiddenMessage(server);

    AuthPlugin.applySessionStrategy(server);

    const getIP = (request) => (
      request.headers['x-real-ip']
      || request.headers['x-forwarded-for']
      || request.info.remoteAddress
      || request.socket.remoteAddress
      || request.socket.info.remoteAddress
    );

    server.method('getIP', getIP, {});
  }
}

module.exports = (() => {
  const plugin = new AuthPlugin();
  return {
    name: NAME,
    register: plugin.register,

    instance: plugin,
    AuthPlugin, // testing only
  };
})();
