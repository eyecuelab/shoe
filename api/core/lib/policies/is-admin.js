import Boom from '@hapi/boom';
import { User } from '../models/user';

const isAdmin = (request, h) => {
  const userId = request.auth.credentials.user_id;

  return User.isInRole(userId, 'Admin').then((admin) => {
    if (!admin) {
      return Boom.forbidden('You are not an admin');
    }

    return h.continue;
  });
};

module.exports = isAdmin;
