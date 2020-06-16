import Redis from 'ioredis';

import Core from '../../core';

import Constants from '../../config/constants';

const { GeneralUtil, LogUtil } = Core.utils;

const REDIS_CONFIG = Core.config.get('redis');

export class RedisService {
  static instance = null;

  static create() {
    this.instance = this.instance == null ? new RedisService() : this.instance;
    return this.instance;
  }

  static get resourceTypes() {
    return Constants.REDIS_RESOURCE_TYPES;
  }

  constructor() {
    this.log = LogUtil.getLogger('RedisService');
    this.redisClient = null;
    GeneralUtil.BindAll(this);
  }

  client() {
    if (this.redisClient) {
      return this.redisClient;
    }

    return this.newClient();
  }

  newClient() {
    const masterNode = {
      host: REDIS_CONFIG.host,
      port: REDIS_CONFIG.port,
    };

    if (REDIS_CONFIG.password && REDIS_CONFIG.password.length) {
      masterNode.password = REDIS_CONFIG.password;
    }

    if (REDIS_CONFIG.cluster) {
      const slaveNode = masterNode;
      masterNode.role = 'master';
      slaveNode.host = slaveNode.host.replace('master', 'slave');
      slaveNode.role = 'slave';
      this.redisClient = new Redis.Cluster([masterNode, slaveNode], { scaleReads: 'slave' });
    } else {
      this.redisClient = new Redis(masterNode);
    }

    return this.redisClient;
  }

  set(type, ...keyVals) {
    if (!Object.values(RedisService.resourceTypes).includes(type)) {
      throw new Error(`Unexpected redis resource type '${type}'`);
    }

    const pipeline = this.client().pipeline();
    keyVals.forEach(([key, value]) => {
      pipeline.set(`${REDIS_CONFIG.queuePrefix}:${key}`, value);
    });
    return pipeline.exec();
  }

  get(type, ...keys) {
    if (!Object.values(RedisService.resourceTypes).includes(type)) {
      throw new Error(`Unexpected redis resource type '${type}'`);
    }

    const pipeline = this.client().pipeline();
    keys.forEach((key) => {
      pipeline.get(`${REDIS_CONFIG.queuePrefix}:${key}`);
    });
    return pipeline.exec();
  }

  publishToApiChannel(json) {
    const channel = REDIS_CONFIG.apiChannel;
    return new Promise((resolve, reject) => {
      this.newClient().subscribe(channel, (err) => {
        if (err) {
          return reject();
        }
        const data = JSON.stringify(json);
        this.newClient().publish(channel, data);
        return resolve();
      });
    });
  }
}

export default RedisService;
