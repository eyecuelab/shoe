import Boom from '@hapi/boom';

import Core from '../../../core';
import Constants from '../../../config/constants';

import { RoleService } from '../../services/role';

import BaseController from '../base';
import { User } from '../../models/user';
import { Session } from '../../models/session';
import { SessionSerializer } from '../../serializers/session';
import { SessionAnonSerializer } from '../../serializers/session_anon';

const { TokenUtil, SessionUtil } = Core.utils;

const CONTROLLER = 'AuthController';

class AuthController extends BaseController {
  constructor() {
    super(CONTROLLER);
    this.token = new TokenUtil();
    this.roleSvc = RoleService.create();
    this.bindAll(this);
  }

  async login(req) {
    const { email, password } = req.payload;

    const user = await User.authenticate(email, password);
    if (!user) {
      return Boom.unauthorized('Wrong email/password');
    }
    const session = await Session.createOne(user.attributes.id);

    const scopes = [...user.attributes.scope];

    const sess = session.attributes;
    sess.passwordHash = user.attributes.password;

    delete user.attributes.password;
    delete user.attributes.scope;

    session.relations.user = user;

    session.attributes.token = SessionUtil.createSession(
      sess,
      scopes,
      Constants.EXPIRATION_PERIOD.MEDIUM);
    session.attributes.scope = scopes;

    req.currentUser = user;

    return SessionSerializer.jsonAPI(session, req);
  }

  logout(req) {
    const sess = new Session();
    sess.id = 'anonymous';

    Session.destroyById(req.auth.credentials.sessionId);

    return SessionAnonSerializer.jsonAPI(sess, req);
  }

  async current(req) {
    delete req.currentUser.attributes.password;
    delete req.currentUser.attributes.scope;

    req.sess.relations.user = req.currentUser;

    return SessionSerializer.jsonAPI(req.sess, req);
  }

  async anon(req) {
    const sess = new Session();
    sess.id = 'anonymous';

    return SessionAnonSerializer.jsonAPI(sess, req);
  }
}

module.exports = new AuthController();
