import JWT from 'jsonwebtoken';
import Hoek from '@hapi/hoek';

import Log from './log';
import Config from '../../../config/config';
import { GeneralUtil } from './general';

const LOG_NAME = 'Token';

const JWT_TYPE = {
  SESSION: 'session',
  TOKEN: 'token',
  USER: 'user',
  CODE: 'code',
};

const ALGO = 'HS256';

export class Token {
  constructor() {
    this.log = Log.getLogger(LOG_NAME);
    this.tokenSecret = Token.tokenSecret;
    GeneralUtil.BindAll(this);
  }

  static get tokenSecret() {
    return Config.get('token.secret');
  }

  get ALGO() {
    return ALGO;
  }

  get JWT_TYPE() {
    return JWT_TYPE;
  }

  // ------------------------------------------------------------
  getTokenSecret(tokenSecret = null) {
    return this.tokenSecret || tokenSecret;
  }

  // ------------------------------------------------------------
  createCode(email, reason, tokenSecret = null) {
    this.log.debug('createCode for %j with %j', reason, email);

    return this.createCodeWithData({
      email,
    }, reason, tokenSecret);
  }

  // ------------------------------------------------------------
  createCodeWithData(data, reason, tokenSecret = null) {
    const defaults = {
      type: this.JWT_TYPE.CODE,
      reason,
    };
    const d = Hoek.applyToDefaults(defaults, data);

    const token = JWT.sign(d,
      this.getTokenSecret(tokenSecret), {
        algorithm: this.ALGO,
      },
    );
    return token;
  }

  // ------------------------------------------------------------
  decodeCode(code, tokenSecret = null) {
    const decoded = JWT.verify(code, this.getTokenSecret(tokenSecret));
    return decoded;
  }
}

export default new Token();
