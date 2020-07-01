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
    'GET', '/orders', controller.getList,
    {
      description: 'Get a list of orders scoped for the current user',
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
    'POST', '/orders', controller.create,
    {
      description: 'Create a new order',
      validate: {
        headers: Joi.object({
          authorization: Joi.string().required(),
        }).unknown(),
        payload: {
          image_file: Joi.object().type(Readable),
          shoe_types: Joi.any(),
          time_frame: Joi.string(),
          add_ons: Joi.any(),
          estimated_price: Joi.number(),
          note: Joi.string(),
          street_address: Joi.string(),
          city: Joi.string(),
          state: Joi.string(),
          postal_code: Joi.string(),
        },
      },
    },
  ],
  [
    'GET', '/orders/{orderID}', controller.get,
    {
      description: 'Get details for an order that you own',
      validate: {
        headers: Joi.object({
          authorization: Joi.string().required(),
        }).unknown(),
      },
    },
  ],
  // [
  //   'PATCH', '/orders/{:id}', controller.update,
  //   {
  //     description: 'update an order',
  //     validate: {
  //       headers: Joi.object({
  //         authorization: Joi.string().required(),
  //       }).unknown(),
  //       payload: {
  //         image_file: Joi.object().type(Readable),
  //         shoe_types: Joi.any(),
  //         time_frame: Joi.string(),
  //         add_ons: Joi.any(),
  //         estimated_price: Joi.number(),
  //         note: Joi.string(),
  //         street_address: Joi.string(),
  //         city: Joi.string(),
  //         state: Joi.string(),
  //         postal_code: Joi.string(),
  //         published_at: Joi.string(),
  //         cleaner_id: Joi.string(),
  //         final_price: Joi.string(),
  //         quote_accepted_at: Joi.string(),
  //       },
  //     },
  //     payload: multipartOpts,
  //   },
  // ],
  // [
  //   'DEL', '/orders/{:id}', controller.delete,
  //   {
  //     description: 'delete an order',
  //     validate: {
  //       headers: Joi.object({
  //         authorization: Joi.string().required(),
  //       }).unknown(),
  //     },
  //   },
  // ],
];

module.exports = (server) => {
  const routes = Routes.map((r) => {
    const [method, path, handler, config] = r;
    return { method, path, handler, config };
  });
  server.route(routes);
};
