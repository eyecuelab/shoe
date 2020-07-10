import Joi from '@hapi/joi';
import { Readable } from 'stream';

import controller from './controller';

const Routes = [
  [
    'GET', '/cleaners', controller.getList,
    {
      description: 'Get a list of cleaners',
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
    'GET', '/cleaners/{cleanerID}', controller.get,
    {
      description: 'Get a cleaner',
      validate: {
        headers: Joi.object({
          authorization: Joi.string().required(),
        }).unknown(),
        params: {
          cleanerID: Joi.number().min(1),
        },
      },
    },
  ],
  [
    'POST', '/cleaners', controller.create,
    {
      description: 'Create a cleaner',
      validate: {
        headers: Joi.object({
          authorization: Joi.string().required(),
        }).unknown(),
        payload: {
          business_name: Joi.string().required(),
          bio: Joi.string().allow(''),
          first_name: Joi.string(),
          last_name: Joi.string(),
          image_file: Joi.object().type(Readable),
          street_address: Joi.string().required(),
          city: Joi.string().required(),
          state: Joi.string().length(2).required(),
          postal_code: Joi.string().required(),
          phone: Joi.string().required(),
          email: Joi.string()
            .email({ minDomainSegments: 2 })
            .lowercase()
            .error(new Error('Must be a valid email address')),
        },
      },
    },
  ],
  [
    'PATCH', '/cleaners/{cleanerID}', controller.update,
    {
      description: 'Update a cleaner profile',
      validate: {
        headers: Joi.object({
          authorization: Joi.string().required(),
        }).unknown(),
        params: {
          cleanerID: Joi.number().min(1),
        },
        payload: {
          business_name: Joi.string().required(),
          first_name: Joi.string(),
          last_name: Joi.string(),
          image_file: Joi.object().type(Readable),
          bio: Joi.string().allow(''),
          street_address: Joi.string().required(),
          city: Joi.string().required(),
          state: Joi.string().length(2).required(),
          postal_code: Joi.string().required(),
          phone: Joi.string().required(),
          email: Joi.string()
            .email({ minDomainSegments: 2 })
            .lowercase()
            .error(new Error('Must be a valid email address')),
        },
      },
    },
  ],
  [
    'DELETE', '/cleaners/{cleanerID}', controller.del,
    {
      description: 'Remove cleaner',
      validate: {
        headers: Joi.object({
          authorization: Joi.string().required(),
        }).unknown(),
        params: {
          cleanerID: Joi.number().min(1),
        },
      },
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
