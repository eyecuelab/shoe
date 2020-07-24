import Joi from '@hapi/joi';
import Promise from 'bluebird';
import Boom from '@hapi/boom';
import uuidv4 from 'uuid/v4';

import { BaseModel } from './base';
import { User } from './user';
import { Cleaner } from './cleaner';
import { Quote } from './quote';
// import JSONAPIUtil from '../utils/jsonapi';


const TABLE_NAME = 'orders';

export class Order extends BaseModel {
  static get TABLE_NAME() {
    return TABLE_NAME;
  }

  get tableName() {
    return TABLE_NAME;
  }

  get soft() {
    return ['deleted_at'];
  }

  // Relations
  user() {
    return this.belongsTo(User);
  }

  cleaner() {
    return this.belongsTo(Cleaner);
  }

  quotes() {
    return this.hasMany(Quote);
  }

  static validate(order) {
    const schema = Joi.object().keys({
      uuid: Joi.string().min(36).max(36).required(),
      image_url: Joi.string().required(),
      shoe_types: Joi.any(),
      time_frame: Joi.string().required(),
      add_ons: Joi.any(),
      estimated_price: Joi.number(),
      final_price: Joi.number(),
      note: Joi.string(),
      published_at: Joi.string().allow(null),
      quote_accepted_at: Joi.string().allow(null),
      cleaner_id: Joi.number().allow(null),
      user_id: Joi.number().required(),
      completed_at: Joi.string().allow(null),
      street_address: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().length(2).required(),
      postal_code: Joi.string.required(),
    });
    return Joi.validate(order, schema);
  }

  static async createOne(props) {
    const defaults = {
      uuid: uuidv4(),
    };
    const data = this.stringify({ ...defaults, ...props });

    const { error } = this.validate(data);
    if (error) {
      return Promise.reject(Boom.badRequest('Order validation failed', error.message, null));
    }

    return this.create(data);
  }

  static findOrdersForUserID(userID) {
    return this.findAll({
      user_id: userID,
    });
  }

  static publishedScope(qb) {
    qb.whereRaw('orders.published_at is not null');
  }

  static quotableScope(qb) {
    qb.whereRaw('orders.quote_accepted_at is null');
  }

  static cleanerScope(cleanerID) {
    return (qb) => {
      qb.whereRaw('orders.cleaner_id = ?', [cleanerID]);
    };
  }

  static inProgressScope(qb) {
    qb.whereNot('orders.shoes_dropped_off', true);
  }

  static completedScope(qb) {
    qb.where('orders.shoes_dropped_off', true);
  }

  static quotedScope(cleanerID) {
    return (qb) => {
      qb.leftJoin('quotes', 'orders.id', 'quotes.order_id');
      qb.whereRaw('quotes.cleaner_id = ?', [cleanerID]);
    };
  }
}

export default Order;
