import Hoek from '@hapi/hoek';
import JWT from 'jsonwebtoken';

import TokenUtil from './token';

export class SessionUtil {
  static createSession(session, scope, expirationPeriod) {
    Hoek.assert(session.passwordHash !== undefined, 'passwordHash required');
    const t = JWT.sign(
      {
        type: TokenUtil.JWT_TYPE.SESSION,
        user_id: session.user_id,
        sessionId: session.id,
        sessionKey: session.key,
        passwordHash: session.passwordHash,
        scope,
      },
      TokenUtil.tokenSecret, {
        algorithm: TokenUtil.ALGO,
        expiresIn: expirationPeriod,
      },
    );
    return t;
  }
}

export default SessionUtil;
