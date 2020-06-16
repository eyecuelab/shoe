import Boom from '@hapi/boom';

const isLoggedIn = (request, h) => {
  const loggedIn = request.auth.isAuthenticated || false;

  if (!loggedIn) {
    return Boom.forbidden('please login');
  }

  return h.continue;
};

module.exports = isLoggedIn;
