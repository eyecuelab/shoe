import Joi from '@hapi/joi';

import controller from './controller';

const Routes = [
  [
    'GET', '/', controller.anon,
    {
      description: 'Root api data call for unauthenticated user',
      notes: 'Provides client side with initial data for unauthenticated user',
      auth: false,
    },
  ],
  [
    'GET', '/session', controller.current,
    {
      description: 'Root api data call for signed in user',
      notes: 'Provides client side with initial data to proceed',
      validate: {
        headers: Joi.object({
          authorization: Joi.string().required(),
        }).unknown(),
      },
    },
  ],
  [
    'POST', '/login', controller.login,
    {
      description: 'Login as a user',
      notes: 'Login and returns a jwt token',
      validate: {
        payload: {
          email: Joi.string()
            .email({ minDomainSegments: 2 })
            .lowercase()
            .error(new Error('Must be a valid email address')),
          password: Joi.string().min(6).required(),
        },
      },
      auth: false,
    },
  ],
  [
    'POST', '/logout', controller.logout,
    {
      description: 'Logout and remove session',
    },
  ],
];

module.exports = (server) => {
  const routes = Routes.map((r) => {
    const [method, path, handler, config] = r;
    config.tags = ['api'];
    return { method, path, handler, config };
  });
  server.route(routes);
};
