import uuidv4 from 'uuid/v4';
import Boom from '@hapi/boom';

import Core from '../../core';
import { BaseModel } from './base';
import { User } from './user';
import Constants from '../../config/constants';

const { GeneralUtil, SessionUtil } = Core.utils;
const { To } = GeneralUtil;

const TABLE_NAME = 'sessions';

export class Session extends BaseModel {
  static get TABLE_NAME() {
    return TABLE_NAME;
  }

  get tableName() {
    return TABLE_NAME;
  }

  // Relations
  user() {
    return this.belongsTo(User);
  }

  static findByKey(key) {
    return this.findOne({}, {
      key,
    });
  }

  static findByUserID(id) {
    return this.findOne({}, {
      user_id: id,
    });
  }

  static findByCredentials(sessionId, sessionKey) {
    return this.findOne({}, {
      id: sessionId,
      key: sessionKey,
    });
  }

  static async createOne(userId, attrs) {
    const [err, sess] = await To(Session.forge({
      ...attrs,
      key: uuidv4(),
      user_id: userId,
    }).save());

    if (err) {
      throw Boom.badRequest('Session failed', 'user', null);
    }

    return sess;
  }

  static async createTokenByUser(user, scopes) {
    const session = await Session.createOne(user.id);
    const sess = session.attributes;
    sess.passwordHash = user.password;
    return SessionUtil.createSession(sess, scopes, Constants.EXPIRATION_PERIOD.MEDIUM);
  }
}

export default Session;
