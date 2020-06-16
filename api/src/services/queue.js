import Queue from 'bull';

import Core from '../../core';
import Constants from '../../config/constants';

import Emailer from '../integrations/email';

// const { S3API } = Core.integrations.S3API;
const { GeneralUtil, LogUtil } = Core.utils;

const REDIS_CONFIG = Core.config.get('redis');
const QUEUE_DELAY = Core.config.get('queue.delay');

const LOG_NAME = 'QueueService';

const { MAIN_QUEUE } = Constants.QUEUE_LIST;

const handlersMap = {};
Object.entries(MAIN_QUEUE.handlers).forEach(([, item]) => {
  handlersMap[item.name] = item.handler;
});

export class QueueService {
  static instance = null;

  static create() {
    this.instance = this.instance == null ? new QueueService() : this.instance;
    return this.instance;
  }

  static queueName(name) {
    return `${REDIS_CONFIG.queuePrefix}-${name}`;
  }

  constructor() {
    this.log = LogUtil.getLogger(LOG_NAME);
    GeneralUtil.BindAll(this);
  }

  async add(name, params, options = {}) {
    if (QUEUE_DELAY === false) {
      return this.handle(name, params);
    }

    const opts = {
      redis: REDIS_CONFIG,
      ...(options || {}),
    };

    try {
      const queueName = QueueService.queueName(name);
      const q = new Queue(queueName, opts);
      q.add(name, params);
    } catch (e) {
      return false;
    }

    return true;
  }

  async handle(name, params) {
    this.log.debug('running: ', name, params);
    const [handler] = params;
    const fn = handlersMap[handler];

    return this[fn](...params.slice(1));
  }

  // Queues and Handles

  async sendEmail(opts, tmplName, context, attachment) {
    return this.add(
      MAIN_QUEUE.name,
      [MAIN_QUEUE.handlers.SEND_EMAIL.name, opts, tmplName, context, attachment],
    );
  }

  async handleSendEmail(opts, tmplName, context, attachment) {
    try {
      return new Emailer().sendEmail(opts, tmplName, context, attachment);
    } catch (err) {
      return null;
    }
  }
}

export default QueueService;
