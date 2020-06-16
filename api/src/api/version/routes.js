import controller from './controller';

const Routes = [
  [
    'GET', '/versions', controller.get,
    { description: 'Versions of nodejs, v8, api',
      notes: 'Use to return the versions and health check',
      auth: false },
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
