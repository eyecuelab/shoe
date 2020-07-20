import Boom from '@hapi/boom';
import Joi from '@hapi/joi';

import Core from '../../../core';
import Constants from '../../../config/constants';

import { RoleService } from '../../services/role';

import BaseController from '../base';
import { User } from '../../models/user';
import { Session } from '../../models/session';
import { SessionSerializer } from '../../serializers/session';
import { SessionAnonSerializer } from '../../serializers/session_anon';
import Cleaner from '../../models/cleaner';

import { AccountEmailer } from '../../services/emailer';

const { TokenUtil, SessionUtil, GeneralUtil } = Core.utils;
const { To } = GeneralUtil;

const CONTROLLER = 'AuthController';

class AuthController extends BaseController {
  constructor() {
    super(CONTROLLER);
    this.token = new TokenUtil();
    this.roleSvc = RoleService.create();
    this.accountEmailer = AccountEmailer.create();
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

    const cleaner = await Cleaner.findByUserID(req.currentUser.id);

    if (cleaner?.id) {
      session.relations.cleaner = cleaner;
    }

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

    const cleaner = await Cleaner.findByUserID(req.currentUser.id);

    if (cleaner?.id) {
      req.sess.relations.cleaner = cleaner;
    }

    return SessionSerializer.jsonAPI(req.sess, req);
  }

  async anon(req) {
    const sess = new Session();
    sess.id = 'anonymous';

    return SessionAnonSerializer.jsonAPI(sess, req);
  }

  async signup(req, h) {
    const [err, user] = await To(User.createOne(this.input(req)));

    if (err) {
      throw Boom.badRequest(err);
    }

    await this.accountEmailer.sendSignupEmail(user);
    return h.response().code(204);
  }

  async signupConfirm(req, h) {
    const { code } = req.payload;
    const user = await this.fetchAndValidateEmailCode(code, 'signup_email');
    this.validateUserInactive(user);

    await User.activateByEmail(user.attributes.email);

    return h.response().code(204);
  }

  input(req) {
    const keys = [
      'first_name',
      'last_name',
      'email',
      'password',
    ];
    return this.cleanInput(req, keys);
  }

  async fetchAndValidateEmailCode(code, reason) {
    const val = this.token.decodeCode(code);
    if (val == null) {
      throw Boom.badRequest('invalid input');
    }

    const schema = Joi.object().keys({
      email: Joi.string().email().required(),
      type: Joi.string().required(),
      reason: Joi.string().required(),
      iat: Joi.number(),
    });

    const validate = await schema.validate(val);
    const check = val.type === 'code' && val.reason === reason;
    if (!validate || !check) {
      throw Boom.badRequest('Invalid email confirmation code');
    }

    return this.getBy({ email: val.email.toLowerCase() }, User);
  }

  validateUserInactive(user) {
    if (user.attributes.is_active) {
      throw Boom.badRequest('User is already active');
    }
  }
}

module.exports = new AuthController();
