import Joi from '@hapi/joi';
import { Readable } from 'stream';

import controller from './controller';

const multipartOpts = {
  maxBytes: 10000000,
  output: 'stream',
  parse: true,
};

const Routes = [
  [
    'GET', '/users', controller.getList,
    {
      description: 'Get a list of users',
      validate: {
        headers: Joi.object({
          authorization: Joi.string().required(),
        }).unknown(),
        query: {
          pageSize: Joi.number().min(10),
          page: Joi.number().min(1),
          filtering: Joi.string(),
          sorting: Joi.string(),
          search: Joi.string().allow(''),
        },
      },
    },
  ],
  [
    'GET', '/users/{userID}', controller.get,
    {
      description: 'Get a user',
      validate: {
        headers: Joi.object({
          authorization: Joi.string().required(),
        }).unknown(),
        params: {
          userID: Joi.number().min(1),
        },
      },
    },
  ],
  // [
  //   'POST', '/users', controller.create,
  //   {
  //     description: 'Create a user',
  //     validate: {
  //       headers: Joi.object({
  //         authorization: Joi.string().required(),
  //       }).unknown(),
  //       payload: {
  //       },
  //     },
  //   },
  // ],
  [
    'PATCH', '/profile', controller.update,
    {
      description: 'Update a profile',
      validate: {
        headers: Joi.object({
          authorization: Joi.string().required(),
        }).unknown(),
        payload: {
          first_name: Joi.string(),
          last_name: Joi.string(),
          email: Joi.string()
            .email({ minDomainSegments: 2 })
            .lowercase()
            .error(new Error('Must be a valid email address')),
          password: Joi.string().min(6).allow(null).allow(''),
          image_file: Joi.object().type(Readable),
        },
      },
      payload: multipartOpts,
    },
  ],
  // [
  //   'DELETE', '/users/{userID}', controller.del,
  //   {
  //     description: 'Remove user',
  //     validate: {
  //       headers: Joi.object({
  //         authorization: Joi.string().required(),
  //       }).unknown(),
  //       params: {
  //         userID: Joi.number().min(1),
  //       },
  //     },
  //   },
  // ],
];

module.exports = (server) => {
  const routes = Routes.map((r) => {
    const [method, path, handler, config] = r;
    config.tags = ['api'];
    return { method, path, handler, config };
  });
  server.route(routes);
};
