import { BaseSerializer } from './base';

export class SessionSerializer extends BaseSerializer {
  static get resourceType() {
    return 'sessions';
  }

  static attrs() {
    return ['key', 'user_id', 'token', 'scope', 'user'];
  }

  static itemMapper(req) {
    return {
      topLevelLinks: {
        self: this.url('session'),
      },
      dataLinks: null,
      attributes: this.attrs(),
      user: {
        ref: 'id',
        attributes: ['uuid', 'first_name', 'last_name', 'profile_image_url', 'email', 'is_active'],
      },
      meta: {
        actions: () => {
          const actions = [
            this.action('POST', 'logout', 'logout'),

            this.action('PATCH', 'update', '/profile', [
              ['first_name', 'text', req.currentUser.attributes.first_name],
              ['last_name', 'text', req.currentUser.attributes.last_name],
              ['email', 'text', req.currentUser.attributes.email],
              ['image_file', 'file'],
              ['password', 'password'],
            ]),
          ];

          return actions;
        },
      },
    };
  }
}

export default SessionSerializer;
