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
      'created_at', 'updated_at',
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
      ['image_file', 'file'],
      ['password', 'password'],
    ]));
    // actions.push(this.action('DELETE', 'delete', `${path}/${record.id}`));

    return actions;
  }
}

export default UserSerializer;
