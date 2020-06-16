import Boom from '@hapi/boom';
import { User } from '../models/user';

const isSuperAdmin = (request, h) => {
  const userId = request.auth.credentials.user_id;

  return User.isInRole(userId, 'SuperAdmin').then((admin) => {
    if (!admin) {
      return Boom.forbidden('You are not an super admin');
    }

    return h.continue;
  });
};

module.exports = isSuperAdmin;
