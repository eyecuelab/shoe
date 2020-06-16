import { BaseModel } from './base';

const TABLE_NAME = 'sessions';

export class Session extends BaseModel {
  static get TABLE_NAME() {
    return TABLE_NAME;
  }

  // eslint-disable-next-line class-methods-use-this
  get tableName() {
    return TABLE_NAME;
  }

  static findByCredentials(sessionId, sessionKey) {
    return this.findOne({}, {
      id: sessionId,
      key: sessionKey,
    });
  }
}

export default Session;
