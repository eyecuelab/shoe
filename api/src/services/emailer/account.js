import Core from '../../../core';

import { BaseEmailer } from './base';
// import { User } from '../../models/user';

const { LogUtil, TokenUtil, GeneralUtil } = Core.utils;
const Config = Core.config;

export const SIGNUP_EMAIL_REASON = 'signup_email';

const LOG_NAME = 'AccountEmailer';

export class AccountEmailer extends BaseEmailer {
  static instance = null;

  static create() {
    this.instance = this.instance == null ? new AccountEmailer() : this.instance;
    return this.instance;
  }

  constructor() {
    super();

    this.log = LogUtil.getLogger(LOG_NAME);
    this.platformURL = Config.get('platformURL');
    this.cmsURL = Config.get('cmsURL');
    this.token = new TokenUtil();

    GeneralUtil.BindAll(this);
  }

  async sendSignupEmail(user) {
    const { email } = user.attributes;
    const options = {
      to: email,
      subject: 'Signup confirmation',
    };
    const code = this.token.createCode(email, SIGNUP_EMAIL_REASON);
    const context = {
      sign_in_url: this.platformURL,
      code,
    };

    return this.sendEmail(options, 'auth/signup-confirm', context);
  }
}

export default AccountEmailer;
