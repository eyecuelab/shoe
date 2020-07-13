import Core from '../../../core';

// import { User } from '../../models/user';
import QueueService from '../queue';

const { LogUtil, GeneralUtil } = Core.utils;

export const CONFIRM_EMAIL_REASON = 'confirm_email';
export const RESET_PASSWORD_REASON = 'reset_password';

const LOG_NAME = 'BaseEmailer';

export class BaseEmailer {
  static instance = null;

  constructor() {
    this.log = LogUtil.getLogger(LOG_NAME);

    GeneralUtil.BindAll(this);
  }

  sendEmail(opts, tmplName, context, attachment) {
    const queueSvc = QueueService.create();
    if (opts.delay === false) {
      return queueSvc.handleSendEmail(opts, tmplName, context, attachment);
    }

    return queueSvc.sendEmail(opts, tmplName, context, attachment);
  }
}
