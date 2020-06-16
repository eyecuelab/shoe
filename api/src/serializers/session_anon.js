import { BaseSerializer } from './base';

export class SessionAnonSerializer extends BaseSerializer {
  static get resourceType() {
    return 'sessions';
  }

  static itemMapper() {
    return {
      topLevelLinks: {
        self: this.url(''),
      },
      dataLinks: null,
      meta: {
        actions: [
          this.action('POST', 'login', 'login', [
            ['email', 'text', null, { required: true }],
            ['password', 'password', null, { required: true }],
          ]),
          this.action('POST', 'signup', 'signup', [
            ['first_name', 'text', null],
            ['last_name', 'text', null],
            ['email', 'text', null, { required: true }],
            ['password', 'password', null, { required: true }],
          ]),
        ],
      },
    };
  }
}

export default SessionAnonSerializer;
