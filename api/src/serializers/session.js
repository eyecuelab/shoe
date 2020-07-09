import { BaseSerializer } from './base';
import CleanerSerializer from './cleaner';

export class SessionSerializer extends BaseSerializer {
  static get resourceType() {
    return 'sessions';
  }

  static attrs() {
    return ['key', 'user_id', 'token', 'scope', 'user', 'cleaner'];
  }

  static itemMapper(req) {
    return {
      topLevelLinks: {
        self: this.url('session'),
        orders: this.url('orders'),
        profile: this.url('profile'),
        cleaners: this.url('cleaners'),
      },
      dataLinks: null,
      attributes: this.attrs(),
      user: this.userRel(),
      cleaner: {
        ref: 'id',
        attributes: CleanerSerializer.attrs(),
      },
      meta: {
        actions: () => {
          const actions = [
            this.action('POST', 'logout', 'logout'),

            this.action('PATCH', 'update', 'profile', [
              ['first_name', 'text', req.currentUser.attributes.first_name],
              ['last_name', 'text', req.currentUser.attributes.last_name],
              ['email', 'text', req.currentUser.attributes.email],
              ['street_address', 'text', req.currentUser.attributes.street_address],
              ['city', 'text', req.currentUser.attributes.city],
              ['state', 'text', req.currentUser.attributes.state],
              ['postal_code', 'text', req.currentUser.attributes.postal_code],
              ['phone', 'text', req.currentUser.attributes.phone],
              ['image_file', 'file'],
              ['password', 'password'],
            ]),
          ];
          actions.push(this.action('POST', 'create_cleaner', 'cleaners', [
            ['first_name', 'text', null],
            ['last_name', 'text', null],
            ['email', 'text', null],
            ['street_address', 'text', null],
            ['city', 'text', null],
            ['state', 'text', null],
            ['postal_code', 'text', null],
            ['phone', 'text', null],
            ['image_file', 'file'],
            ['bio', 'text', null],
            ['business_name', 'text', null],
          ]));
          return actions;
        },
      },
    };
  }
}

export default SessionSerializer;
