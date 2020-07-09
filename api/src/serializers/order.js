import { BaseSerializer } from './base';

export class OrderSerializer extends BaseSerializer {
  static get resourceType() {
    return 'orders';
  }

  static resourceRoot() {
    return 'orders';
  }

  static attrs() {
    return [
      'uuid', 'image_url', 'shoe_types', 'time_frame', 'note',
      'estimated_price', 'final_price', 'add_ons', 'street_address',
      'city', 'state', 'postal_code', 'created_at', 'updated_at', 'published_at',
      'quote_accepted_at', 'cleaner_id', 'user_id', 'completed_at',
    ];
  }

  static listMapper(req, { pagination }) {
    const path = this.resourceRoot(req);
    return {
      topLevelLinks: {
        self: path,
      },
      dataLinks: {
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
        actions: (record) => this.orderActions(req, record),
      },
    };
  }


  static listActions(req) {
    const path = this.resourceRoot(req);
    const actions = [];

    actions.push(this.action('POST', 'create', path, [
      ['image_file', 'file'],
      ['shoe_types', 'object', null],
      ['time_frame', 'text', null],
      ['note', 'text', null],
      ['estimated_price', 'number', null],
      ['final_price', 'number', null],
      ['add_ons', 'object', null],
      ['street_address', 'text', null],
      ['city', 'text', null],
      ['state', 'text', null],
      ['postal_code', 'text', null],
    ]));

    return actions;
  }

  static orderActions(req, record) {
    const path = this.resourceRoot(req);
    const actions = [];

    actions.push(this.action('PATCH', 'update', `${path}/${record.id}`, [
      ['image_file', 'file'],
      ['shoe_types', 'array', record.shoe_types],
      ['time_frame', 'text', record.time_frame],
      ['note', 'text', record.note],
      ['estimated_price', 'number', record.estimated_price],
      ['final_price', 'number', record.final_price],
      ['add_ons', 'object', record.add_ons],
      ['street_address', 'text', record.street_address],
      ['city', 'text', record.city],
      ['state', 'text', record.state],
      ['postal_code', 'text', record.postal_code],
    ]));
    actions.push(this.action('DELETE', 'delete', `${path}/${record.id}`));
    return actions;
  }
}

export default OrderSerializer;
