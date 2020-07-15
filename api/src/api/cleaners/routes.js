import Joi from '@hapi/joi';

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
    'GET', '/cleaners/{cleanerID}/orders', controller.getOrders,
    {
      description: 'Get orders for a cleaner',
      validate: {
        headers: Joi.object({
          authorization: Joi.string().required(),
        }).unknown(),
        params: {
          cleanerID: Joi.number().min(1),
        },
        query: {
          quotable: Joi.boolean(),
          quoted: Joi.boolean(),
          in_progress: Joi.boolean(),
          completed: Joi.boolean(),
        },
      },
    },
  ],
  [
    'GET', '/cleaners/{cleanerID}/orders/{orderID}', controller.getOrderDetail,
    {
      description: 'Get order details for a cleaner order',
      validate: {
        headers: Joi.object({
          authorization: Joi.string().required(),
        }).unknown(),
        params: {
          cleanerID: Joi.number().min(1),
          orderID: Joi.number().min(1),
        },
      },
    },
  ],
  [
    'PATCH', '/cleaners/{cleanerID}/orders/{orderID}', controller.updateOrder,
    {
      description: 'Update an order as a cleaner',
      validate: {
        headers: Joi.object({
          authorization: Joi.string().required(),
        }).unknown(),
        params: {
          cleanerID: Joi.number().min(1),
          orderID: Joi.number().min(1),
        },
        payload: {
          shoes_picked_up: Joi.boolean(),
          shoes_cleaned: Joi.boolean(),
          shoes_polished: Joi.boolean(),
          request_payment: Joi.boolean(),
          shoes_dropped_off: Joi.boolean(),
        },
      },
    },
  ],
  [
    'POST', '/cleaners/{cleanerID}/orders/{orderID}/quote', controller.quoteOrder,
    {
      description: 'Create a quote for an order as a cleaner',
      validate: {
        headers: Joi.object({
          authorization: Joi.string().required(),
        }).unknown(),
        params: {
          cleanerID: Joi.number().min(1),
          orderID: Joi.number().min(1),
        },
        payload: {
          quoted_price: Joi.number(),
          expires_at: Joi.string(),
          delivery_by: Joi.string(),
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
          image_url: Joi.string().uri(),
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
          business_name: Joi.string(),
          first_name: Joi.string(),
          last_name: Joi.string(),
          image_url: Joi.string().uri(),
          bio: Joi.string().allow(''),
          street_address: Joi.string(),
          city: Joi.string(),
          state: Joi.string().length(2),
          postal_code: Joi.string(),
          phone: Joi.string(),
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
