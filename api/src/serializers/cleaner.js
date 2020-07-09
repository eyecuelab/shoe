import { BaseSerializer } from './base';

export class CleanerSerializer extends BaseSerializer {
  static get resourceType() {
    return 'cleaners';
  }

  static resourceRoot() {
    return 'cleaners';
  }

  static attrs() {
    return [
      'first_name', 'last_name', 'email', 'image_url', 'created_at',
      'updated_at', 'phone', 'street_address', 'city', 'state',
      'postal_code', 'business_name', 'bio',
    ];
  }

  static listMapper(req, { pagination }) {
    const path = this.resourceRoot(req);
    return {
      topLevelLinks: {
        self: path,
      },
      dataLinks: {
        /* eslint-disable-next-line no-unused-vars */
        self: (record, current) => this.url(`${path}/${current.id}`),
      },
      attributes: this.attrs(),
      meta: {
        pagination,
        actions: this.listActions(req),
      },
      dataMeta: null,
    };
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
        actions: (record) => this.cleanerActions(req, record),
      },
    };
  }

  static listActions(req) {
    const path = this.resourceRoot(req);
    const actions = [];

    actions.push(this.action('POST', 'create', `${path}`, [
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
  }

  static cleanerActions(req, record) {
    const path = this.resourceRoot(req);
    const actions = [];

    if (req.currentUser.id === record.user_id) {
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
        ['bio', 'text', record.bio],
        ['business_name', 'text', record.business_name],
      ]));
      actions.push(this.action('DELETE', 'delete', `${path}/${record.id}`));
    }

    return actions;
  }
}

export default CleanerSerializer;
