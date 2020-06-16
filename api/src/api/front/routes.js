// import Joi from '@hapi/joi';

import controller from './controller';

const Routes = [
  [
    'GET', '/home', controller.home,
    {
      description: 'Home Page',
      auth: false,
    },
  ],
];

module.exports = (server) => {
  const routes = Routes.map((r) => {
    const [method, path, handler, config] = r;
    return { method, path, handler, config };
  });
  server.route(routes);
};
