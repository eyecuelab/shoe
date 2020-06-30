import { BaseSerializer } from './base';

export class UserSerializer extends BaseSerializer {
  static get resourceType() {
    return 'users';
  }

  static resourceRoot() {
    return 'users';
  }

  static attrs() {
    return [
      'first_name', 'last_name', 'email', 'scope', 'image_url',
      'created_at', 'updated_at', 'phone', 'street_address', 'city', 'state',
      'postal_code',
    ];
  }

  static itemMapper(req) {
    const path = this.resourceRoot(req);
    return {
      topLevelLinks: {
        self: (record) => this.url(`${path}/${record.id}`),
      },
      dataLinks: null,
      attributes: this.attrs(),
      meta: {
        actions: (record) => this.userActions(req, record),
      },
    };
  }

  static userActions(req, record) {
    const path = this.resourceRoot(req);
    const actions = [];

    actions.push(this.action('PATCH', 'update', `${path}/${record.id}`, [
      ['first_name', 'text', record.first_name],
      ['last_name', 'text', record.last_name],
      ['email', 'text', record.email],
      ['street_address', 'text', record.street_address],
      ['city', 'text', record.city],
      ['state', 'text', record.state],
      ['postal_code', 'text', record.postal_code],
      ['phone', 'text', record.phone],
      ['image_file', 'file'],
    ]));

    return actions;
  }
}

export default UserSerializer;
